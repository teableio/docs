"""Guard the SEO failure modes found in the documentation audit."""
import unittest

from check_docs_seo import page_errors as source_errors, retired_redirect_errors, indexability_errors
from check_rendered_seo import page_errors as rendered_errors

SOURCE = '''---
title: "Email automation"
description: "Connect incoming email to Teable"
---

## Prepare Gmail

<a className="docs-card-link" href="/en/basic/automation"><Card title="Automation">Create a workflow</Card></a>
'''
HTML = '''<html><head><title>Email automation - Teable</title><meta name="description" content="Connect incoming email to Teable"></head><body><h1>Email automation</h1><h2 id="prepare-gmail">Prepare Gmail</h2><a class="docs-card-link" href="/en/basic/automation"><div>Create a workflow</div></a></body></html>'''


class SourceChecks(unittest.TestCase):
    def test_valid_page_and_protected_code_examples(self):
        self.assertEqual(source_errors(SOURCE), [])
        example = '\n````mdx\n```\n# Code heading\n<Card href="/sample"/>\n<script type="application/ld+json">{}</script>\n```\n````\n'
        self.assertEqual(source_errors(SOURCE + example), [])
        self.assertEqual(source_errors(SOURCE + '\nInline `<h1>` and ``<Card href="/demo"/>`` examples.'), [])

    def test_audited_source_regressions_fail(self):
        for value, message in (
            (SOURCE.replace('description: "Connect incoming email to Teable"', 'description: ""'), 'description'),
            (SOURCE.replace('## Prepare', '# Prepare'), 'H1'),
            (SOURCE + '\n   # Indented heading', 'H1'),
            (SOURCE + '\n<h1>HTML heading</h1>', 'H1'),
            (SOURCE + '\n<Card href="/en"/>', 'Card href'),
            (SOURCE + '\n<script type="application/ld+json" />', 'JSON-LD'),
        ):
            with self.subTest(message=message):
                self.assertTrue(any(message in error for error in source_errors(value)))

    def test_retired_routes_cannot_lose_or_change_their_permanent_redirects(self):
        config = {'redirects': [{'source': '/en/basic/space/ai-setting',
                                'destination': '/en/basic/ai/custom-model', 'permanent': True}]}
        self.assertEqual(retired_redirect_errors(config, ['en']), [])
        self.assertTrue(retired_redirect_errors({'redirects': []}, ['en']))
        config['redirects'][0]['permanent'] = False
        self.assertTrue(retired_redirect_errors(config, ['en']))
        config['redirects'][0]['permanent'] = True
        config['redirects'][0]['destination'] = '/en'
        self.assertTrue(retired_redirect_errors(config, ['en']))

    def test_indexability_is_independent_of_edited_frontmatter(self):
        pages = {'en/index': ({'noindex': True}, '')}
        self.assertTrue(indexability_errors(pages, set()))
        self.assertEqual(indexability_errors(pages, {'en/index'}), [])
        pages['en/index'][0]['noindex'] = False
        self.assertTrue(indexability_errors(pages, {'en/index'}))


class RenderedChecks(unittest.TestCase):
    def check(self, value, required=('prepare-gmail',)):
        return rendered_errors('en/example', SOURCE, value, required)

    def test_valid_rendered_page(self):
        self.assertEqual(self.check(HTML), [])

    def test_noindex_cannot_pass_by_matching_an_accidental_source_edit(self):
        edited = SOURCE.replace('description:', 'noindex: true\ndescription:')
        raw = HTML.replace('</head>', '<meta name="robots" content="noindex"></head>')
        self.assertTrue(any('noindex' in value for value in rendered_errors('en/index', edited, raw, expected_noindex=False)))

    def test_audited_html_regressions_fail(self):
        for value, message in (
            (HTML.replace('<h2 id="prepare-gmail">', '<h1 id="prepare-gmail">').replace('</h2>', '</h1>'), 'H1'),
            (HTML.replace('id="prepare-gmail"', 'id="renamed"'), 'historical hash'),
            (HTML.replace('</body>', '<span id="prepare-gmail"></span></body>'), 'duplicate content ID'),
            (HTML.replace('href="/en/basic/automation"', 'href="/en/wrong"'), 'destinations'),
            (HTML.replace('<div>Create a workflow</div>', '<a href="/en">Nested</a>'), 'nested interaction'),
            (HTML.replace('</head>', '<script type="application/ld+json"></script></head>'), 'JSON-LD'),
            (HTML.replace('</head>', '<meta name="robots" content="noindex"></head>'), 'noindex'),
            (HTML.replace('content="Connect incoming email to Teable"', 'content="Generic description"'), 'description'),
        ):
            with self.subTest(message=message):
                self.assertTrue(any(message in error for error in self.check(value)))


if __name__ == '__main__':
    unittest.main()
