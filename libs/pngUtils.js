var PNG = {
    parse: function (imgTag) {
        var base64 = PNG.asBase64(imgTag);
        var byteData = PNG.utils.base64StringToByteArray(base64);
        var parsedPngData = PNG.utils.parseBytes(byteData);

        return PNG.utils.enrichParsedData(parsedPngData);
    },

    asBase64: function (imgTag) {
        var canvas = document.createElement("canvas");
        canvas.width = imgTag.width;
        canvas.height = imgTag.height;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(imgTag, 0, 0);
        var dataURL = canvas.toDataURL("image/png");
        return dataURL.split('base64,')[1];
    },

    utils: {
        base64StringToByteArray: function (base64String) {
            //http://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript
            var byteCharacters = atob(base64String);
            var byteNumbers = new Array(byteCharacters.length);
            for (var i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            return new Uint8Array(byteNumbers);
        },

        parseBytes: function (bytes) {
            var pngData = {};
            //see https://en.wikipedia.org/wiki/Portable_Network_Graphics

            //verify file header
            pngData['headerIsValid'] = bytes[0] == 0x89
                && bytes[1] == 0x50
                && bytes[2] == 0x4E
                && bytes[3] == 0x47
                && bytes[4] == 0x0D
                && bytes[5] == 0x0A
                && bytes[6] == 0x1A
                && bytes[7] == 0x0A

            if (!pngData.headerIsValid) {
                console.warn('Provided data does not belong to a png');
                return pngData;
            }

            //parsing chunks
            var chunks = [];

            var chunk = PNG.utils.parseChunk(bytes, 8);
            chunks.push(chunk);

            while (chunk.name !== 'IEND') {
                chunk = PNG.utils.parseChunk(bytes, chunk.end);
                chunks.push(chunk);
            }

            pngData['chunks'] = chunks;
            return pngData;
        },

        parseChunk: function (bytes, start) {
            var chunkLength = PNG.utils.bytes2Int(bytes.slice(start, start + 4));

            var chunkName = '';
            chunkName += String.fromCharCode(bytes[start + 4]);
            chunkName += String.fromCharCode(bytes[start + 5]);
            chunkName += String.fromCharCode(bytes[start + 6]);
            chunkName += String.fromCharCode(bytes[start + 7]);

            var chunkData = [];
            for (var idx = start + 8; idx < chunkLength + start + 8; idx++) {
                chunkData.push(bytes[idx]);
            }

            //TODO validate crc as required!

            return {
                start: start,
                end: Number(start) + Number(chunkLength) + 12, //12 = 4 (length) + 4 (name) + 4 (crc)
                length: chunkLength,
                name: chunkName,
                data: chunkData,
                crc: [
                    bytes[chunkLength + start + 8],
                    bytes[chunkLength + start + 9],
                    bytes[chunkLength + start + 10],
                    bytes[chunkLength + start + 11]
                ],
                crcChecked: false
            };
        },

        enrichParsedData: function (pngData) {
            var idhrChunk = PNG.utils.getChunk(pngData, 'IDHR');

            //see http://www.libpng.org/pub/png/spec/1.2/PNG-Chunks.html
            pngData.width = PNG.utils.bytes2Int(idhrChunk.data.slice(0, 4));
            pngData.height = PNG.utils.bytes2Int(idhrChunk.data.slice(4, 8));
            pngData.bitDepth = PNG.utils.bytes2Int(idhrChunk.data.slice(8, 9));
            pngData.colorType = PNG.utils.bytes2Int(idhrChunk.data.slice(9, 10));
            pngData.compressionMethod = PNG.utils.bytes2Int(idhrChunk.data.slice(10, 11));
            pngData.filterMethod = PNG.utils.bytes2Int(idhrChunk.data.slice(11, 12));
            pngData.interlaceMethod = PNG.utils.bytes2Int(idhrChunk.data.slice(12, 13));

            pngData.isGreyScale = pngData.colorType == 0 || pngData.colorType == 4;
            pngData.isRgb = pngData.colorType == 2 || pngData.colorType == 6;
            pngData.hasAlpha = pngData.colorType == 4 || pngData.colorType == 6;
            pngData.hasPaletteMode = pngData.colorType == 3 && PNG.utils.getChunk(pngData, 'PLTE') != null;

            return pngData;
        },

        getChunks: function (pngData, chunkName) {
            var chunksForName = [];
            for (var idx = 0; idx < pngData.chunks.length; idx++) {
                if (pngData.chunks[idx].name = chunkName) {
                    chunksForName.push(pngData.chunks[idx]);
                }
            }
            return chunksForName;
        },

        getChunk: function (pngData, chunkName) {
            for (var idx = 0; idx < pngData.chunks.length; idx++) {
                if (pngData.chunks[idx].name = chunkName) {
                    return pngData.chunks[idx];
                }
            }
            return null;
        },

        bytes2Int: function (bytes) {
            var ret = 0;

            for (var idx = 0; idx < bytes.length; idx++) {
                ret += bytes[idx];
                if (idx < bytes.length - 1) {
                    ret = ret << 8;
                }
            }

            return ret;
        }
    }
}