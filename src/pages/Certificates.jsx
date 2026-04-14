import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Award, Download, Calendar, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function Certificates() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: certificates = [], isLoading } = useQuery({
    queryKey: ['myCertificates', user?.id],
    queryFn: () => base44.entities.Certificate.filter({ user_id: user?.id }, '-issued_at'),
    enabled: !!user?.id,
  });

  const [downloadingId, setDownloadingId] = useState(null);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const generateCertificateHtml = (certificate) => {
    const formattedDate = formatDate(certificate.issued_at);
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Certificado</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,600&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  :root{
    --gold:#c9955a;
    --gold-lt:#e4b87a;
    --cream:#f0e6d3;
    --line:rgba(201,149,90,.65);
    --deco:rgba(160,60,30,.42);
  }
  html,body{
    width:100%;min-height:100vh;
    background:#111;
    display:flex;align-items:center;justify-content:center;
  }
  .cert{
    width:297mm; height:210mm;
    position:relative; overflow:hidden; flex-shrink:0;
    background: radial-gradient(ellipse 82% 72% at 50% 34%,
      #541515 0%, #330b0b 48%, #1d0505 100%);
    border:2.5px solid var(--gold);
  }
  .cert::after{
    content:''; position:absolute; inset:6mm;
    border:1px solid var(--line);
    pointer-events:none; z-index:0;
  }
  .side{
    position:absolute; top:0; bottom:0; width:20mm;
    display:flex; flex-direction:column;
    align-items:center; justify-content:space-evenly;
    padding:8mm 0; z-index:1; pointer-events:none;
  }
  .side.L{left:0} .side.R{right:0}
  .sh-circ{
    width:12mm; height:12mm; border-radius:50%;
    border:1.3px solid var(--deco); position:relative;
    display:flex; align-items:center; justify-content:center;
  }
  .sh-circ::before{
    content:''; width:52%; height:52%;
    border-radius:50%; border:1px solid var(--deco);
  }
  .sh-arch{
    width:10mm; height:15mm;
    border:1.3px solid var(--deco);
    border-radius:50% 50% 0 0/55% 55% 0 0;
    position:relative;
  }
  .sh-arch::before{
    content:''; position:absolute; inset:17% 17% 0;
    border:1px solid var(--deco);
    border-radius:50% 50% 0 0/55% 55% 0 0;
  }
  .sh-arch::after{
    content:''; position:absolute; inset:34% 34% 0;
    border:1px solid var(--deco);
    border-radius:50% 50% 0 0/55% 55% 0 0;
  }
  .sh-ticks{display:flex;gap:2.5px;height:13mm}
  .sh-ticks span{width:1.5px;height:100%;background:var(--deco);border-radius:1px}
  .body{
    position:relative; z-index:2;
    width:100%; height:100%;
    display:flex; flex-direction:column;
    align-items:center; justify-content:space-evenly;
    padding:8mm 22mm;
  }
  .logo img{ height:23mm; display:block; }
  .t-title{
    font-family:'Spalla', 'Cormorant Garamond', Georgia, serif;
    font-size:19mm; font-weight:700;
    letter-spacing:.22em;
    color:var(--cream);
    text-transform:uppercase;
    line-height:1;
    text-align:center;
  }
  .t-sub{
    font-family:'Cormorant Garamond', serif;
    font-size:4.8mm; font-weight:300; letter-spacing:.14em;
    color:var(--cream); text-align:center;
  }
  .block-nome{
    display:flex; flex-direction:column;
    align-items:center; gap:2.5mm; width:100%;
  }
  .divider{
    width:64%; height:1px;
    background:linear-gradient(90deg,transparent,var(--gold-lt) 25%,var(--gold-lt) 75%,transparent);
  }
  .t-nome{
    font-family:'Cormorant Garamond', serif;
    font-size:9.5mm; font-weight:400; letter-spacing:.07em;
    color:var(--cream); text-align:center;
  }
  .t-label{
    font-family:'Cormorant Garamond', serif;
    font-size:4.3mm; font-weight:300; letter-spacing:.12em;
    color:var(--cream); text-align:center;
  }
  .t-curso{
    font-family:'Cormorant Garamond', serif;
    font-size:7mm; font-style:italic; font-weight:600;
    letter-spacing:.06em; color:var(--gold-lt); text-align:center;
  }
  .block-data{
    display:flex; flex-direction:column;
    align-items:center; gap:1.2mm;
  }
  .t-em{
    font-family:'Cormorant Garamond', serif;
    font-size:4mm; font-weight:300; letter-spacing:.12em; color:var(--cream);
  }
  .t-data{
    font-family:'Cormorant Garamond', serif;
    font-size:4.8mm; font-weight:300; letter-spacing:.08em;
    color:var(--cream); text-align:center;
  }
  .footer{
    display:flex; flex-direction:column;
    align-items:center; gap:2mm; width:44%;
  }
  .footer-line{
    width:100%; height:1px;
    background:linear-gradient(90deg,transparent,var(--gold-lt) 25%,var(--gold-lt) 75%,transparent);
  }
  .t-empresa{
    font-family:'Cormorant Garamond', serif;
    font-size:4mm; font-weight:300;
    letter-spacing:.16em; color:var(--cream);
  }
</style>
</head>
<body>
<div id="cert-render" class="cert">
  <div class="side L">
    <div class="sh-ticks"><span></span><span></span><span></span></div>
    <div class="sh-circ"></div><div class="sh-arch"></div>
    <div class="sh-circ"></div><div class="sh-arch"></div>
    <div class="sh-circ"></div>
    <div class="sh-ticks"><span></span><span></span><span></span></div>
  </div>
  <div class="side R">
    <div class="sh-ticks"><span></span><span></span><span></span></div>
    <div class="sh-circ"></div><div class="sh-arch"></div>
    <div class="sh-circ"></div><div class="sh-arch"></div>
    <div class="sh-circ"></div>
    <div class="sh-ticks"><span></span><span></span><span></span></div>
  </div>
  <div class="body">
    <div class="logo">
      <img src="https://media.base44.com/images/public/6914f15cd0b06aabd6ad50f8/0587160f0_01.png" alt="Pizza Bis" crossorigin="anonymous" style="height:23mm;display:block">
    </div>
    <div class="t-title">Certificado</div>
    <div class="t-sub">Este certificado atesta que</div>
    <div class="block-nome">
      <div class="divider"></div>
      <div class="t-nome">${certificate.user_name || ''}</div>
    </div>
    <div class="t-label">concluiu com sucesso o curso de:</div>
    <div class="t-curso">${certificate.course_title || ''}</div>
    <div class="block-data">
      <div class="t-em">em:</div>
      <div class="t-data">${formattedDate}</div>
    </div>
    <div class="footer">
      <div class="footer-line"></div>
      <div class="t-empresa">Pizza Bis</div>
    </div>
  </div>
</div>
</body>
</html>`;
  };

  const handleDownload = async (certificate) => {
    setDownloadingId(certificate.id);
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.innerHTML = generateCertificateHtml(certificate);
    document.body.appendChild(container);

    const el = container.querySelector('#cert-render');
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, allowTaint: false });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
    pdf.save(`certificado-${certificate.code}.pdf`);

    document.body.removeChild(container);
    setDownloadingId(null);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
          Meus Certificados
        </h1>
        <p className="text-slate-400">Certificados dos cursos que você concluiu</p>
      </div>

      {/* Certificates Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 bg-slate-900/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : certificates.length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardContent className="p-12 text-center">
            <Award className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Nenhum certificado ainda
            </h3>
            <p className="text-slate-400">
              Complete seus cursos para receber certificados
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map((certificate) => (
            <Card
              key={certificate.id}
              className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm hover:bg-slate-900/70 transition-all duration-300 overflow-hidden group"
            >
              <div className="bg-gradient-to-br from-violet-600 to-purple-600 p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
                <div className="relative">
                  <Award className="w-12 h-12 text-white mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">
                    Certificado de Conclusão
                  </h3>
                  <Badge className="bg-white/20 text-white border-white/30">
                    {certificate.code}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-6 space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">
                    {certificate.course_title}
                  </h4>
                  <p className="text-sm text-slate-400">
                    Instrutor: {certificate.instructor_name}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(certificate.issued_at)}</span>
                  </div>
                  {certificate.total_hours && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{certificate.total_hours}h</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <Button
                    className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                    onClick={() => handleDownload(certificate)}
                    disabled={downloadingId === certificate.id}
                  >
                    {downloadingId === certificate.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    {downloadingId === certificate.id ? 'Gerando PDF...' : 'Baixar PDF'}
                  </Button>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <p className="text-xs text-slate-500 text-center">
                    Código de verificação: {certificate.code}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}