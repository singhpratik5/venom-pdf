// Minimal valid standard PDF with styled content (heading, paragraph, code block, footer)
// used for instant in-browser demonstration and testing.
export const generateSamplePdfBytes = (): Uint8Array => {
  const content = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842]
   /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >>
   /Contents 7 0 R
>>
endobj
4 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842]
   /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >>
   /Contents 8 0 R
>>
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
endobj
6 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
7 0 obj
<< /Length 520 >>
stream
BT
/F1 24 Tf
50 780 Td
0 0 0 rg
(Venom PDF — Smart Dark Mode Preview) Tj
ET
0.2 0.5 0.9 rg
50 765 495 2 re
f
BT
/F2 13 Tf
50 730 Td
0 0 0 rg
(Page 1: Intelligent Color Inversion Demonstration) Tj
0 -26 Td
0.3 0.3 0.3 rg
(Unlike naive tools that simply invert RGB pixels, Venom PDF preserves) Tj
0 -20 Td
(vector crispness, retains syntax colors, and dynamically injects background) Tj
0 -20 Td
(canvases to prevent blinding white halation on OLED and LCD screens.) Tj
ET
0.9 0.9 0.9 rg
50 600 495 80 re
f
0.2 0.2 0.2 RG
1 w
50 600 495 80 re
S
BT
/F1 11 Tf
65 655 Td
0.1 0.5 0.2 rg
(// Code Example: Clean Rust Engine) Tj
0 -18 Td
/F2 11 Tf
0 0 0 rg
(fn invert_stream(theme: &Theme) -> Result<(), VenomError> {) Tj
0 -16 Td
(    theme.map_luminance(stream.operators()?);) Tj
0 -16 Td
(}) Tj
ET
BT
/F2 10 Tf
250 50 Td
0.5 0.5 0.5 rg
(Page 1 of 2  |  Venom PDF Previewer) Tj
ET
endstream
endobj
8 0 obj
<< /Length 380 >>
stream
BT
/F1 22 Tf
50 780 Td
0 0 0 rg
(Page 2: High Contrast & Multi-Theme System) Tj
ET
0.8 0.3 0.3 rg
50 765 495 2 re
f
BT
/F2 13 Tf
50 720 Td
0 0 0 rg
(Curated Reading Presets:) Tj
0 -24 Td
0.2 0.2 0.2 rg
(- Venom Dark: High contrast neon toxic green accent) Tj
0 -20 Td
(- OLED Black: True zero-light pixel conservation) Tj
0 -20 Td
(- Dracula: Purple-cyan hacker aesthetic) Tj
0 -20 Td
(- Nord: Arctic ice blue reading comfort) Tj
0 -20 Td
(- Sepia: Gentle warm daylight book tint) Tj
ET
BT
/F2 10 Tf
250 50 Td
0.5 0.5 0.5 rg
(Page 2 of 2  |  Venom PDF Previewer) Tj
ET
endstream
endobj
xref
0 9
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000121 00000 n 
0000000262 00000 n 
0000000403 00000 n 
0000000478 00000 n 
0000000548 00000 n 
0000001138 00000 n 
trailer
<< /Size 9 /Root 1 0 R >>
startxref
1588
%%EOF`;

  const encoder = new TextEncoder();
  return encoder.encode(content);
};
