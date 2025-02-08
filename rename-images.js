const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// 生成随机文件名
function generateRandomName(length = 8) {
    return crypto.randomBytes(length).toString('hex');
}

// 递归获取所有图片文件
async function getAllImages(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
            files.push(...(await getAllImages(fullPath)));
        } else if (/\.(png|jpg|jpeg|gif|webp)$/i.test(entry.name)) {
            files.push(fullPath);
        }
    }

    return files;
}

// 递归获取所有 MDX 文件
async function getAllMdxFiles(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
            files.push(...(await getAllMdxFiles(fullPath)));
        } else if (entry.name.endsWith('.mdx')) {
            files.push(fullPath);
        }
    }

    return files;
}

async function main() {
    try {
        // 获取所有图片文件
        const imageFiles = await getAllImages('./images');
        const imageMapping = new Map();

        // 为每个图片生成新名字并重命名
        for (const imagePath of imageFiles) {
            const ext = path.extname(imagePath);
            const newName = generateRandomName() + ext;
            const dirName = path.dirname(imagePath);
            const newPath = path.join(dirName, newName);
            
            // 记录原路径和新路径的映射
            const relativePath = imagePath.replace(/\\/g, '/'); // 统一使用正斜杠
            const newRelativePath = newPath.replace(/\\/g, '/');
            imageMapping.set(relativePath, newRelativePath);

            // 重命名文件
            await fs.rename(imagePath, newPath);
            console.log(`Renamed: ${imagePath} -> ${newPath}`);
        }

        // 获取所有 MDX 文件
        const mdxFiles = await getAllMdxFiles('.');

        // 更新所有 MDX 文件中的图片引用
        for (const mdxFile of mdxFiles) {
            let content = await fs.readFile(mdxFile, 'utf-8');
            let hasChanges = false;

            // 对每个图片路径进行替换
            for (const [oldPath, newPath] of imageMapping) {
                // 确保路径以 /images 开头
                const oldImagePath = oldPath.startsWith('/') ? oldPath : `/${oldPath}`;
                const newImagePath = newPath.startsWith('/') ? newPath : `/${newPath}`;

                if (content.includes(oldImagePath)) {
                    content = content.split(oldImagePath).join(newImagePath);
                    hasChanges = true;
                }
            }

            // 只有当文件有变化时才写入
            if (hasChanges) {
                await fs.writeFile(mdxFile, content, 'utf-8');
                console.log(`Updated: ${mdxFile}`);
            }
        }

        console.log('Image renaming completed successfully!');
    } catch (err) {
        console.error('Error:', err);
    }
}

main(); 
