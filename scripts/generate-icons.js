import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const iconSvgPath = join(__dirname, '../static/icons/icon.svg');
const iconsDir = join(__dirname, '../static/icons');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

const svgBuffer = readFileSync(iconSvgPath);

async function generateIcons() {
	console.log('Generating PWA icons...');

	for (const size of sizes) {
		const outputPath = join(iconsDir, `icon-${size}x${size}.png`);
		await sharp(svgBuffer).resize(size, size).png().toFile(outputPath);
		console.log(`✓ Generated ${size}x${size} icon`);
	}

	// Generate maskable icons (with safe zone padding)
	const maskableSizes = [192, 512];
	for (const size of maskableSizes) {
		const outputPath = join(iconsDir, `icon-${size}x${size}-maskable.png`);
		const padding = Math.floor(size * 0.1); // 10% padding for safe zone

		await sharp(svgBuffer)
			.resize(size - padding * 2, size - padding * 2)
			.extend({
				top: padding,
				bottom: padding,
				left: padding,
				right: padding,
				background: { r: 59, g: 130, b: 246, alpha: 1 }
			})
			.png()
			.toFile(outputPath);
		console.log(`✓ Generated ${size}x${size} maskable icon`);
	}

	console.log('✓ All icons generated successfully!');
}

generateIcons().catch(console.error);
