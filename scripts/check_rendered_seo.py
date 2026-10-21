#!/usr/bin/env python3
"""Check real HTML from a running Mintlify preview; never send analytics events."""
import argparse
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
import html
import gzip
import json
from pathlib import Path
import re
import sys
import urllib.parse
import urllib.request
import urllib.error

from bs4 import BeautifulSoup
from check_docs_seo import frontmatter, unfenced


def selected_pages(root, all_pages=False):
    config = json.loads((root / 'docs.json').read_text())
    routes = set()
    for item in config['navigation']['languages']:
        locale = item['language']
        if all_pages:
            routes.update(p.relative_to(root).with_suffix('').as_posix() for p in (root / locale).rglob('*.mdx'))
        else:
            routes.update(f'{locale}/{suffix}' for suffix in (
                'index', 'basic/ai/overview', 'api-doc/overview', 'deploy/docker',
                'deploy/nginx', 'deploy/dashboard', 'basic/ai/custom-model', 'basic/automation/trigger/email/gmail-imap'))
            routes.update(p.relative_to(root).with_suffix('').as_posix() for p in (root / locale).glob('changelog*.mdx'))
            # Every native-card conversion is checked, not just a sample.
            for path in (root / locale).rglob('*.mdx'):
                if 'docs-card-link' in unfenced(path.read_text()):
                    routes.add(path.relative_to(root).with_suffix('').as_posix())
    for policy in ('seo-archive-policy', 'seo-hidden-pages'):
        routes.update(item['page'] for item in json.loads((root / f'.github/{policy}.json').read_text()))
    return sorted(routes)


def page_errors(route, source, raw, required_ids=(), expected_noindex=None):
    metadata, body = frontmatter(source)
    soup = BeautifulSoup(raw, 'html.parser')
    errors = []
    h1 = soup.find_all('h1')
    if len(h1) != 1:
        errors.append(f'expected one H1, got {len(h1)}')
    elif h1[0].get_text(' ', strip=True) != metadata['title']:
        errors.append('H1 does not match source title')
    if not soup.title or metadata['title'] not in soup.title.get_text():
        errors.append('HTML title does not include source title')
    description = soup.find('meta', attrs={'name': 'description'})
    if metadata.get('description') and (not description or description.get('content') != metadata['description']):
        errors.append('meta description does not match source')
    robots = ','.join(tag.get('content', '') for tag in soup.find_all('meta', attrs={'name': re.compile('^robots$', re.I)})).lower()
    if expected_noindex is None:
        expected_noindex = metadata.get('noindex') is True
    if ('noindex' in robots) != expected_noindex:
        errors.append('robots noindex does not match source policy')
    content = soup.select_one('#content') or soup.body or soup
    content_ids = Counter(tag['id'] for tag in content.find_all(id=True))
    for identity, count in content_ids.items():
        if count > 1:
            errors.append(f'duplicate content ID {identity} ({count})')
    ids = {tag['id'] for tag in soup.find_all(id=True)}
    for identity in required_ids:
        if identity not in ids:
            errors.append(f'missing historical hash {identity}')
    wrappers = re.findall(r'<a\b[^>]*className="docs-card-link"[^>]*>', unfenced(body), re.S)
    actual = soup.select('a.docs-card-link')
    if len(actual) != len(wrappers):
        errors.append(f'native Card count mismatch: {len(actual)} vs {len(wrappers)}')
    expected_links = []
    for opening in wrappers:
        match = re.search(r'\bhref="([^"]+)"', opening)
        if match:
            expected_links.append(html.unescape(match[1]))
    if sorted(tag.get('href', '') for tag in actual) != sorted(expected_links):
        errors.append('native Card destinations differ from source')
    for tag in actual:
        if tag.select('a, button, input, select, textarea, [role=link], [role=button]'):
            errors.append('Card anchor contains nested interaction')
    for tag in soup.find_all('script', attrs={'type': 'application/ld+json'}):
        try:
            value = json.loads(tag.string or tag.get_text())
            if not value or not isinstance(value, (dict, list)):
                errors.append('empty or unsupported JSON-LD value')
        except ValueError:
            errors.append('invalid or empty JSON-LD script')
    return errors


def required_hashes(root):
    result = json.loads((root / '.github/changelog-annual-anchors.json').read_text())
    for locale, periods in json.loads((root / '.github/changelog-history-anchors.json').read_text()).items():
        for period, values in periods.items():
            result[f'{locale}/changelog-{period}'] = values
    for item in json.loads((root / '.github/changelog-date-corrections.json').read_text()):
        result.setdefault(item['page'], []).append(item['legacyAnchor'])
    for route, values in json.loads((root / '.github/gmail-setup-evidence.json').read_text())['legacy_anchors'].items():
        result[route] = values
    return result



class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def check_retired_redirects(base_url, locales):
    opener = urllib.request.build_opener(NoRedirect())
    errors = []
    for locale in locales:
        route = f'/{locale}/basic/space/ai-setting'
        expected = f'/{locale}/basic/ai/custom-model'
        try:
            with opener.open(base_url.rstrip('/') + route, timeout=30) as response:
                errors.append(f'{route}: expected redirect, got HTTP {response.status}')
        except urllib.error.HTTPError as error:
            destination = urllib.parse.urlsplit(urllib.parse.urljoin(base_url, error.headers.get('Location', '')))
            origin = urllib.parse.urlsplit(base_url)
            if error.code not in (307, 308) or destination.netloc != origin.netloc or destination.path != expected:
                errors.append(f'{route}: unexpected redirect HTTP {error.code} to {error.headers.get("Location")}')
        except OSError as error:
            errors.append(f'{route}: {error}')
    return errors


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-url', default='http://localhost:3000')
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--all', action='store_true', help='check every current MDX page as well as archives')
    parser.add_argument('--workers', type=int, default=3)
    args = parser.parse_args()
    if not 1 <= args.workers <= 8:
        parser.error('--workers must be between 1 and 8')
    config = json.loads((args.root / 'docs.json').read_text())
    locales = [item['language'] for item in config['navigation']['languages']]
    noindex_routes = {item['page'] for policy in ('seo-archive-policy', 'seo-hidden-pages') for item in json.loads((args.root / f'.github/{policy}.json').read_text())}
    noindex_routes.update(f'{locale}/deploy/dashboard' for locale in locales)
    hashes = required_hashes(args.root)
    routes = selected_pages(args.root, args.all)
    def verify(route):
        url_route = '' if route == 'index' else route[:-len('/index')] if route.endswith('/index') else route
        url = args.base_url.rstrip('/') + '/' + urllib.parse.quote(url_route, safe='/')
        try:
            request = urllib.request.Request(url, headers={'Accept-Encoding': 'gzip', 'User-Agent': 'Teable-Docs-SEO-Check/1.0'})
            with urllib.request.urlopen(request, timeout=90) as response:
                if response.status != 200:
                    return [f'{route}: HTTP {response.status}']
                payload = response.read()
                if response.headers.get('Content-Encoding', '').lower() == 'gzip':
                    payload = gzip.decompress(payload)
                raw = payload.decode('utf-8')
            source = (args.root / (route + '.mdx')).read_text()
            return [f'{route}: {message}' for message in page_errors(route, source, raw, hashes.get(route, []), route in noindex_routes)]
        except (OSError, ValueError) as error:
            return [f'{route}: {error}']
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        errors = [error for group in pool.map(verify, routes) for error in group]
    errors.extend(check_retired_redirects(args.base_url, locales))
    if errors:
        print('\n'.join(errors), file=sys.stderr)
        return 1
    print(f'Rendered SEO checks passed: {len(routes)} pages, including all historical anchors and native cards.')
    print('Deployment checks still required: canonical/hreflang, sitemap, RSS, hosted redirects and GA4 receipt.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
