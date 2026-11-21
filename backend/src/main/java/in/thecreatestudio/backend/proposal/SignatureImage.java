package in.thecreatestudio.backend.proposal;

import in.thecreatestudio.backend.common.ApiException;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Base64;
import javax.imageio.ImageIO;

/** Validates hand-drawn signatures sent as PNG data URLs from the signature pad. */
final class SignatureImage {

    private static final String PREFIX = "data:image/png;base64,";
    private static final int MAX_BYTES = 300_000;

    private SignatureImage() {}

    static String validate(String dataUrl) {
        if (dataUrl == null || !dataUrl.startsWith(PREFIX)) {
            throw ApiException.badRequest("Please draw your signature.");
        }
        byte[] png = decode(dataUrl);
        if (png.length > MAX_BYTES) throw ApiException.badRequest("Signature image is too large.");
        try {
            BufferedImage img = ImageIO.read(new ByteArrayInputStream(png));
            if (img == null || img.getWidth() < 50 || img.getHeight() < 20 || img.getWidth() > 3000 || img.getHeight() > 2000) {
                throw ApiException.badRequest("Signature image is not valid.");
            }
            if (!hasInk(img)) throw ApiException.badRequest("Please draw your signature.");
        } catch (IOException e) {
            throw ApiException.badRequest("Signature image is not valid.");
        }
        return dataUrl;
    }

    static byte[] decode(String dataUrl) {
        try {
            return Base64.getDecoder().decode(dataUrl.substring(PREFIX.length()));
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest("Signature image is not valid.");
        }
    }

    /** Rejects empty canvases: requires a minimum number of non-transparent, non-white pixels. */
    private static boolean hasInk(BufferedImage img) {
        int ink = 0;
        for (int y = 0; y < img.getHeight(); y += 2) {
            for (int x = 0; x < img.getWidth(); x += 2) {
                int argb = img.getRGB(x, y);
                int a = (argb >>> 24) & 0xff, r = (argb >> 16) & 0xff, g = (argb >> 8) & 0xff, b = argb & 0xff;
                if (a > 40 && (r + g + b) < 600 && ++ink > 40) return true;
            }
        }
        return false;
    }
}
