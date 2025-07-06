// gif-encoder.js
class GIFEncoder {
    constructor(width, height, colors = 256) {
        this.width = width;
        this.height = height;
        this.colors = colors;
        this.frames = [];
        this.delays = [];
        this.globalPalette = null;
    }

    addFrame(imageData, delay) {
        this.frames.push(imageData);
        this.delays.push(delay);
    }

    encode() {
        this.globalPalette = this.createGlobalPalette();
        const buffer = [];
        
        // GIF Header
        buffer.push(0x47, 0x49, 0x46, 0x38, 0x39, 0x61); // "GIF89a"
        
        // Logical Screen Descriptor
        buffer.push(...this.numToBytes(this.width, 2));
        buffer.push(...this.numToBytes(this.height, 2));
        buffer.push(0xF0 | (Math.log2(this.colors) - 1)); // Packed field
        buffer.push(0x00); // Background color index
        buffer.push(0x00); // Pixel aspect ratio
        
        // Global Color Table
        for (let i = 0; i < this.colors * 3; i++) {
            buffer.push(this.globalPalette[i] || 0);
        }
        
        // Application Extension (for looping)
        buffer.push(0x21, 0xFF, 0x0B, ...'NETSCAPE2.0'.split('').map(c => c.charCodeAt(0)), 0x03, 0x01, 0x00, 0x00, 0x00);
        
        // Add frames
        for (let i = 0; i < this.frames.length; i++) {
            this.addImageFrame(buffer, this.frames[i], this.delays[i]);
        }
        
        // Trailer
        buffer.push(0x3B);
        
        return new Uint8Array(buffer);
    }

    addImageFrame(buffer, imageData, delay) {
        // Graphic Control Extension
        buffer.push(0x21, 0xF9, 0x04, 0x00, ...this.numToBytes(delay / 10, 2), 0x00, 0x00);
        
        // Image Descriptor
        buffer.push(0x2C, ...this.numToBytes(0, 2), ...this.numToBytes(0, 2),
                    ...this.numToBytes(this.width, 2), ...this.numToBytes(this.height, 2), 0x00);
        
        // Encode pixel data
        const indexStream = this.imageToIndexed(imageData);
        const lzwData = this.encodeLZW(indexStream);
        
        buffer.push(8); // LZW minimum code size
        for (let i = 0; i < lzwData.length; i += 255) {
            const chunk = lzwData.slice(i, i + 255);
            buffer.push(chunk.length);
            buffer.push(...chunk);
        }
        buffer.push(0x00); // Block terminator
    }

    createGlobalPalette() {
        // Fixed 256-color palette
        const palette = new Uint8Array(256 * 3);
        let idx = 0;
        
        // Color cube
        const levels = [0, 51, 102, 153, 204, 255];
        for (const r of levels) {
            for (const g of levels) {
                for (const b of levels) {
                    palette[idx++] = r;
                    palette[idx++] = g;
                    palette[idx++] = b;
                }
            }
        }
        
        // Grayscale ramp
        for (let i = 0; i < 40; i++) {
            const val = Math.min(255, Math.floor(i * 6.4));
            palette[idx++] = val;
            palette[idx++] = val;
            palette[idx++] = val;
        }
        
        return palette;
    }

    imageToIndexed(imageData) {
        const indices = new Uint8Array(this.width * this.height);
        const palette = this.globalPalette;
        
        for (let i = 0, j = 0; i < imageData.length; i += 4, j++) {
            const r = imageData[i];
            const g = imageData[i + 1];
            const b = imageData[i + 2];
            
            // Find closest color in palette
            let minDist = Infinity;
            let bestIdx = 0;
            
            for (let k = 0; k < this.colors; k++) {
                const p = k * 3;
                const dr = r - palette[p];
                const dg = g - palette[p + 1];
                const db = b - palette[p + 2];
                const dist = dr * dr + dg * dg + db * db;
                
                if (dist < minDist) {
                    minDist = dist;
                    bestIdx = k;
                    if (dist === 0) break;
                }
            }
            
            indices[j] = bestIdx;
        }
        
        return indices;
    }

    encodeLZW(data) {
        // Initialize dictionary
        const dict = new Map();
        for (let i = 0; i < 256; i++) {
            dict.set(String.fromCharCode(i), i);
        }

        let nextCode = 258;
        let current = '';
        let codeSize = 9;
        let buffer = 0;
        let bitsInBuffer = 0;
        const output = [];

        const writeCode = (code) => {
            buffer |= code << bitsInBuffer;
            bitsInBuffer += codeSize;

            while (bitsInBuffer >= 8) {
                output.push(buffer & 0xFF);
                buffer >>>= 8;
                bitsInBuffer -= 8;
            }

            if (nextCode === (1 << codeSize) && codeSize < 12) {
                codeSize++;
            }
        };

        // Write clear code at the beginning
        writeCode(256);

        for (const byte of data) {
            const char = String.fromCharCode(byte);
            const combined = current + char;

            if (dict.has(combined)) {
                current = combined;
            } else {
                writeCode(dict.get(current));
                dict.set(combined, nextCode++);
                current = char;

                // Reset dictionary when full
                if (nextCode === 4096) {
                    writeCode(256); // Clear code
                    dict.clear();
                    for (let i = 0; i < 256; i++) {
                        dict.set(String.fromCharCode(i), i);
                    }
                    nextCode = 258;
                    codeSize = 9;
                }
            }
        }

        // Output the last code
        if (current) {
            writeCode(dict.get(current));
        }

        // Write end code
        writeCode(257);

        // Flush remaining bits
        if (bitsInBuffer > 0) {
            output.push(buffer & 0xFF);
        }

        return output;
    }

    numToBytes(num, bytes) {
        const arr = [];
        for (let i = 0; i < bytes; i++) {
            arr.push(num & 0xFF);
            num >>= 8;
        }
        return arr;
    }
}