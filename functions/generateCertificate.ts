import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import puppeteer from 'npm:puppeteer-core@21.6.1';

function generateCertificateHtml(name, courseTitle, completionDate) {
  const formattedDate = new Date(completionDate).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return `<!DOCTYPE html>
<html lang="pt-br">
<head>
<meta charset="UTF-8">
<title>Certificado</title>
<style>
  body {
    background: #f0f0f0;
    font-family: "Georgia", serif;
    margin: 0;
    padding: 20px;
  }
  .certificado {
    width: 1000px;
    height: 700px;
    margin: auto;
    background: white;
    border: 15px solid #0b2a4a;
    padding: 40px;
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
  }
  .corner-top {
    position: absolute;
    width: 150px;
    height: 150px;
    background: linear-gradient(135deg, #d4af37, #f5e6a6);
    border-radius: 0 0 100% 0;
    top: 0;
    right: 0;
  }
  .corner-bottom {
    position: absolute;
    width: 150px;
    height: 150px;
    background: linear-gradient(135deg, #d4af37, #f5e6a6);
    border-radius: 0 0 100% 0;
    bottom: 0;
    left: 0;
    transform: rotate(180deg);
  }
  .titulo {
    text-align: center;
    font-size: 48px;
    color: #0b2a4a;
    margin-top: 40px;
    margin-bottom: 20px;
    font-weight: bold;
  }
  .subtitulo {
    text-align: center;
    font-size: 18px;
    color: #333;
    margin-bottom: 20px;
  }
  .nome {
    text-align: center;
    font-size: 42px;
    color: #c49b3d;
    font-style: italic;
    border-bottom: 2px solid #0b2a4a;
    display: inline-block;
    padding: 10px 30px;
    margin: 10px auto;
  }
  .container-nome {
    text-align: center;
  }
  .curso-label {
    text-align: center;
    font-size: 18px;
    color: #333;
    margin-top: 20px;
  }
  .curso-nome {
    text-align: center;
    font-size: 26px;
    font-weight: bold;
    color: #0b2a4a;
    margin-top: 6px;
  }
  .texto {
    text-align: center;
    font-size: 18px;
    margin-top: 20px;
    color: #333;
  }
  .data {
    text-align: center;
    font-size: 26px;
    margin-top: 6px;
    font-weight: bold;
    color: #0b2a4a;
  }
  .assinatura {
    position: absolute;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    text-align: center;
  }
  .linha {
    width: 300px;
    border-top: 2px solid #0b2a4a;
    margin-bottom: 10px;
  }
  .diretor {
    font-size: 18px;
    color: #333;
  }
</style>
</head>
<body>
<div class="certificado">
  <div class="corner-top"></div>
  <div class="corner-bottom"></div>

  <div class="titulo">Certificado</div>

  <div class="subtitulo">Este certificado atesta que</div>

  <div class="container-nome">
    <div class="nome">${name}</div>
  </div>

  <div class="curso-label">concluiu com sucesso o curso:</div>
  <div class="curso-nome">${courseTitle}</div>

  <div class="texto">concluído em:</div>
  <div class="data">${formattedDate}</div>

  <div class="assinatura">
    <div class="linha"></div>
    <div class="diretor">Responsável</div>
  </div>
</div>
</body>
</html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { certificate_id } = await req.json();

    // Buscar o certificado
    const certificates = await base44.entities.Certificate.filter({ id: certificate_id, user_id: user.id });
    const certificate = certificates[0];

    if (!certificate) {
      return Response.json({ error: 'Certificado não encontrado' }, { status: 404 });
    }

    const html = generateCertificateHtml(
      certificate.user_name || user.full_name,
      certificate.course_title,
      certificate.issued_at
    );

    // Usar Puppeteer para gerar PDF
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.setViewport({ width: 1100, height: 800 });

    const pdfBuffer = await page.pdf({
      width: '1100px',
      height: '800px',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    await browser.close();

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificado-${certificate.code}.pdf"`,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});