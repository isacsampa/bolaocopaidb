import zlib
import struct

def analyze():
    with open("logo fifa.png", "rb") as f:
        signature = f.read(8)
        if signature != b"\x89PNG\r\n\x1a\n":
            print("Not a valid PNG file")
            return
            
        idat_data = b""
        plte_data = b""
        trns_data = b""
        
        while True:
            chunk_header = f.read(8)
            if len(chunk_header) < 8:
                break
            length, chunk_type = struct.unpack(">I4s", chunk_header)
            data = f.read(length)
            crc = f.read(4)
            
            if chunk_type == b"IHDR":
                width, height, bit_depth, color_type, compression, filter_method, interlace = struct.unpack(">IIBBBBB", data)
                print(f"IHDR: Width={width}, Height={height}, ColorType={color_type}, BitDepth={bit_depth}")
            elif chunk_type == b"IDAT":
                idat_data += data
            elif chunk_type == b"PLTE":
                plte_data = data
            elif chunk_type == b"tRNS":
                trns_data = data
            elif chunk_type == b"IEND":
                break
                
        # Decompress IDAT
        decompressed = zlib.decompress(idat_data)
        print("Decompressed IDAT length:", len(decompressed))
        
        # Determine bytes per pixel (bpp)
        if color_type == 6: # RGBA
            bpp = 4
        elif color_type == 2: # RGB
            bpp = 3
        elif color_type == 3: # Palette
            bpp = 1
        elif color_type == 0: # Grayscale
            bpp = 1
        elif color_type == 4: # Grayscale + Alpha
            bpp = 2
        else:
            print("Unknown color type")
            return
            
        # Let's inspect some pixels from the decompressed data
        # Row size = 1 (filter byte) + width * bpp
        row_size = 1 + width * bpp
        
        # Let's sample a few rows: top row (row 0), middle row (row height//2)
        # We'll just look at the first pixel of row 0
        def get_pixel_at(x, y):
            offset = y * row_size
            filter_byte = decompressed[offset]
            pixel_offset = offset + 1 + x * bpp
            pixel_bytes = decompressed[pixel_offset:pixel_offset+bpp]
            return pixel_bytes
            
        print("Pixel at (0,0):", list(get_pixel_at(0, 0)))
        print("Pixel at (width//2, height//4):", list(get_pixel_at(width//2, height//4)))
        print("Pixel at (width//2, height//2):", list(get_pixel_at(width//2, height//2)))
        print("Pixel at (width//2, height - 10):", list(get_pixel_at(width//2, height - 10)))
        
        if color_type == 3:
            print("Palette size:", len(plte_data) // 3)
            # print palette entry for pixel (0,0)
            p_idx = get_pixel_at(0,0)[0]
            print(f"Palette[{p_idx}]:", list(plte_data[p_idx*3:p_idx*3+3]))
            p_idx_mid = get_pixel_at(width//2, height//2)[0]
            print(f"Palette[{p_idx_mid}]:", list(plte_data[p_idx_mid*3:p_idx_mid*3+3]))

analyze()
