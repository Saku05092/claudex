import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const OUTPUT_DIR = join(import.meta.dirname, '..', 'data', 'images')
const IMAGE_SIZE = 1080

interface PostConfig {
  readonly filename: string
  readonly category: string
  readonly title: string
  readonly themeColor: string
}

const posts: readonly PostConfig[] = [
  {
    filename: 'defi-guide.png',
    category: 'DEFI GUIDE',
    title: 'DeFiとは？初心者でもわかる分散型金融入門',
    themeColor: '#10B981',
  },
  {
    filename: 'crypto-card.png',
    category: 'CARD COMPARISON',
    title: '日本で使えるクリプトカード TOP3',
    themeColor: '#8B5CF6',
  },
  {
    filename: 'airdrop-alert.png',
    category: 'AIRDROP ALERT',
    title: '新プロトコル Rysk Premium でエアドロップの可能性',
    themeColor: '#F59E0B',
  },
] as const

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`)
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  }
}

function buildImageMarkup(post: PostConfig): Record<string, unknown> {
  const { r, g, b } = hexToRgb(post.themeColor)
  const lightBg = `rgba(${r}, ${g}, ${b}, 0.08)`
  const accentBg = `rgba(${r}, ${g}, ${b}, 0.15)`

  return {
    type: 'div',
    props: {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${lightBg} 0%, white 50%, ${accentBg} 100%)`,
        padding: '60px',
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              height: '100%',
              backgroundColor: 'white',
              borderRadius: '32px',
              padding: '64px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
              border: `3px solid ${post.themeColor}20`,
              justifyContent: 'space-between',
            },
            children: [
              // Category label
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                  },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          backgroundColor: `rgba(${r}, ${g}, ${b}, 0.12)`,
                          color: post.themeColor,
                          fontSize: '28px',
                          fontWeight: 700,
                          padding: '12px 28px',
                          borderRadius: '12px',
                          letterSpacing: '2px',
                        },
                        children: post.category,
                      },
                    },
                  ],
                },
              },
              // Main title
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px 0',
                  },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: '52px',
                          fontWeight: 700,
                          color: '#1a1a2e',
                          lineHeight: 1.4,
                          textAlign: 'center',
                        },
                        children: post.title,
                      },
                    },
                  ],
                },
              },
              // Footer
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    justifyContent: 'center',
                    borderTop: '2px solid #f0f0f0',
                    paddingTop: '24px',
                  },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: '24px',
                          fontWeight: 600,
                          color: '#9ca3af',
                          letterSpacing: '3px',
                        },
                        children: 'CLAUDEX | DYOR - NFA',
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  }
}

async function fetchFont(): Promise<ArrayBuffer> {
  const fontUrl =
    'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-jp@5.0.1/files/noto-sans-jp-japanese-400-normal.woff'

  console.log('Fetching Noto Sans JP font...')
  const response = await fetch(fontUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch font: ${response.status} ${response.statusText}`)
  }
  return response.arrayBuffer()
}

async function generateImage(
  post: PostConfig,
  fontData: ArrayBuffer,
): Promise<{ filePath: string; sizeKB: number }> {
  const markup = buildImageMarkup(post)

  const svg = await satori(markup as Parameters<typeof satori>[0], {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    fonts: [
      {
        name: 'Noto Sans JP',
        data: fontData,
        weight: 400,
        style: 'normal' as const,
      },
      {
        name: 'Noto Sans JP',
        data: fontData,
        weight: 700,
        style: 'normal' as const,
      },
    ],
  })

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width' as const, value: IMAGE_SIZE },
  })
  const png = resvg.render().asPng()

  const filePath = join(OUTPUT_DIR, post.filename)
  writeFileSync(filePath, png)

  const sizeKB = Math.round(png.length / 1024)
  return { filePath, sizeKB }
}

async function main(): Promise<void> {
  mkdirSync(OUTPUT_DIR, { recursive: true })

  const fontData = await fetchFont()
  console.log('Font loaded successfully.\n')

  console.log('Generating Instagram post images (1080x1080)...\n')

  const results = await Promise.all(
    posts.map((post) => generateImage(post, fontData)),
  )

  for (const result of results) {
    console.log(`  Created: ${result.filePath}`)
    console.log(`  Size:    ${result.sizeKB} KB\n`)
  }

  console.log(`Done. ${results.length} images saved to ${OUTPUT_DIR}`)
}

main().catch((error) => {
  console.error('Image generation failed:', error)
  process.exit(1)
})
