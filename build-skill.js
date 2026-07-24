import fs from 'fs'
import path from 'path'
import archiver from 'archiver'

const root = process.cwd()
const outDir = path.join(root, 'dist')
const outZip = path.join(outDir, 'multi-note-skill.zip')

// files and folders to include in package
const entries = [
    'SKILL.md',
    'README.md',
    'package.json',
    'index.js',
    'core',
    'assets',
    'examples',
    'references'
]

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir)

const output = fs.createWriteStream(outZip)
const archive = archiver('zip', { zlib: { level: 9 } })

output.on('close', () => {
    console.log(`Created ${outZip} (${archive.pointer()} total bytes)`)
})

archive.on('warning', err => {
    if (err.code === 'ENOENT') console.warn(err)
    else throw err
})

archive.on('error', err => { throw err })

archive.pipe(output)

for (const entry of entries) {
    const full = path.join(root, entry)
    if (fs.existsSync(full)) {
        const stats = fs.statSync(full)
        if (stats.isDirectory()) {
            archive.directory(full, entry)
        } else {
            archive.file(full, { name: entry })
        }
    } else {
        console.warn(`Warning: ${entry} not found, skipping`)
    }
}

archive.finalize()
