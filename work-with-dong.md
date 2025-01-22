# Dong Files

Dong files are image files that play audio when opened. The mime type is `application/prs.vielle.dong`

## Creating a `.dong` file

A dong file is structured as follows:

```txt
d0<version>
<image-mime><image-data>
<audio-mime><audio-data>
<image-data>
<audio-data>
```

### Version

Version is an 8 bit number that indicates the version of the dong file. This file documents version 2 of the dong file format. This is prefixed with the hex value d0 to indicate that this is a dong file. The first 16 bits of a version 2 `.dong` file should be `11010000 00000010`. If this does not match, it is either a different file format or version.

### Image Metadata

Image metadata starts with a mimetype. The mimetype is 255 bytes long, followed by a 00 byte. If the mimetype is shorter than 255 characters, the remaining bytes are filled with 00 bytes.  
The metadata is then followed with an image length, which must be 32 bits long. This represents the number of bytes in the image data.

### Audio Metadata

See: Image metadata

### Image Data

This is a binary blob taking up the number of bytes allocated in image-length.

### Audio Data

This is a binary blob taking up the number of bytes allocated in audio-length.
