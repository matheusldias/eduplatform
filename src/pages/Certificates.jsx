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
    return `
      <html><head>
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
        .cert{
          width:1122px;height:794px;
          background:#1a0a00;
          position:relative;overflow:hidden;
          display:flex;flex-direction:column;align-items:center;justify-content:center;
          font-family:'Cormorant Garamond',Georgia,serif;
        }
        /* Gradiente radial de fundo */
        .cert::before{
          content:'';position:absolute;inset:0;
          background:radial-gradient(ellipse 80% 60% at 50% 50%,#3a1800 0%,#1a0a00 100%);
          z-index:0;
        }
        /* Borda dupla dourada */
        .border-outer{
          position:absolute;inset:18px;
          border:2px solid var(--gold);
          z-index:1;pointer-events:none;
        }
        .border-inner{
          position:absolute;inset:26px;
          border:1px solid rgba(201,149,90,.40);
          z-index:1;pointer-events:none;
        }
        /* Ornamentos de canto SVG */
        .corner{
          position:absolute;width:90px;height:90px;z-index:2;
          background:none;
        }
        .corner svg{display:block;}
        .corner.tl{top:22px;left:22px;}
        .corner.tr{top:22px;right:22px;transform:scaleX(-1);}
        .corner.bl{bottom:22px;left:22px;transform:scaleY(-1);}
        .corner.br{bottom:22px;right:22px;transform:scale(-1,-1);}
        /* Corpo central */
        .body{
          position:relative;z-index:3;
          display:flex;flex-direction:column;align-items:center;
          width:820px;text-align:center;gap:0;
        }
        .eyebrow{
          font-size:11px;letter-spacing:5px;text-transform:uppercase;
          color:var(--gold-lt);margin-bottom:6px;font-weight:300;
        }
        .title{
          font-size:72px;font-weight:600;color:var(--gold);
          line-height:1;letter-spacing:2px;margin-bottom:10px;
        }
        .divider{
          width:340px;height:1px;background:var(--line);margin:0 auto 14px;
        }
        .intro{
          font-size:14px;letter-spacing:3px;text-transform:uppercase;
          color:var(--cream);font-weight:300;margin-bottom:16px;
        }
        .student-name{
          font-size:46px;font-style:italic;font-weight:600;
          color:#fff;line-height:1.1;margin-bottom:14px;
        }
        .course-label{
          font-size:11px;letter-spacing:4px;text-transform:uppercase;
          color:var(--gold-lt);font-weight:300;margin-bottom:6px;
        }
        .course-name{
          font-size:22px;font-weight:600;color:var(--gold);
          letter-spacing:1px;margin-bottom:18px;
          max-width:700px;line-height:1.3;
        }
        .divider2{width:260px;height:1px;background:var(--line);margin:0 auto 18px;}
        .meta-row{
          display:flex;align-items:flex-start;justify-content:center;gap:60px;
        }
        .meta-col{display:flex;flex-direction:column;align-items:center;gap:4px;}
        .meta-label{
          font-size:9px;letter-spacing:3px;text-transform:uppercase;
          color:var(--gold-lt);font-weight:300;
        }
        .meta-value{
          font-size:15px;font-weight:600;color:#fff;letter-spacing:.5px;
        }
        .meta-sep{width:1px;height:40px;background:var(--line);margin-top:4px;}
        /* Código de verificação */
        .verify{
          position:absolute;bottom:32px;left:50%;transform:translateX(-50%);
          z-index:3;text-align:center;
        }
        .verify span{
          font-size:9px;letter-spacing:3px;text-transform:uppercase;
          color:rgba(201,149,90,.5);
        }
      </style>
      </head><body style="margin:0;padding:0;background:#1a0a00;">
      <div id="cert-render" class="cert">

        <!-- Borda dupla -->
        <div class="border-outer"></div>
        <div class="border-inner"></div>

        <!-- Cantos ornamentais -->
        <div class="corner tl">
          <svg viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 4 L4 86" stroke="#c9955a" stroke-width="1.5"/>
            <path d="M4 4 L86 4" stroke="#c9955a" stroke-width="1.5"/>
            <path d="M16 16 Q16 30 30 16" stroke="#c9955a" stroke-width="1" fill="none"/>
            <circle cx="4" cy="4" r="3" fill="#c9955a"/>
            <circle cx="20" cy="4" r="1.5" fill="rgba(201,149,90,.5)"/>
            <circle cx="4" cy="20" r="1.5" fill="rgba(201,149,90,.5)"/>
          </svg>
        </div>
        <div class="corner tr">
          <svg viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 4 L4 86" stroke="#c9955a" stroke-width="1.5"/>
            <path d="M4 4 L86 4" stroke="#c9955a" stroke-width="1.5"/>
            <path d="M16 16 Q16 30 30 16" stroke="#c9955a" stroke-width="1" fill="none"/>
            <circle cx="4" cy="4" r="3" fill="#c9955a"/>
            <circle cx="20" cy="4" r="1.5" fill="rgba(201,149,90,.5)"/>
            <circle cx="4" cy="20" r="1.5" fill="rgba(201,149,90,.5)"/>
          </svg>
        </div>
        <div class="corner bl">
          <svg viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 4 L4 86" stroke="#c9955a" stroke-width="1.5"/>
            <path d="M4 4 L86 4" stroke="#c9955a" stroke-width="1.5"/>
            <path d="M16 16 Q16 30 30 16" stroke="#c9955a" stroke-width="1" fill="none"/>
            <circle cx="4" cy="4" r="3" fill="#c9955a"/>
            <circle cx="20" cy="4" r="1.5" fill="rgba(201,149,90,.5)"/>
            <circle cx="4" cy="20" r="1.5" fill="rgba(201,149,90,.5)"/>
          </svg>
        </div>
        <div class="corner br">
          <svg viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 4 L4 86" stroke="#c9955a" stroke-width="1.5"/>
            <path d="M4 4 L86 4" stroke="#c9955a" stroke-width="1.5"/>
            <path d="M16 16 Q16 30 30 16" stroke="#c9955a" stroke-width="1" fill="none"/>
            <circle cx="4" cy="4" r="3" fill="#c9955a"/>
            <circle cx="20" cy="4" r="1.5" fill="rgba(201,149,90,.5)"/>
            <circle cx="4" cy="20" r="1.5" fill="rgba(201,149,90,.5)"/>
          </svg>
        </div>

        <!-- Corpo -->
        <div class="body">
          <p class="eyebrow">Certificado de Conclusão</p>
          <h1 class="title">Certificado</h1>
          <div class="divider"></div>
          <p class="intro">Certificamos que</p>
          <h2 class="student-name">${certificate.user_name || ''}</h2>
          <p class="course-label">concluiu com êxito o curso</p>
          <p class="course-name">${certificate.course_title || ''}</p>
          <div class="divider2"></div>
          <div class="meta-row">
            <div class="meta-col">
              <span class="meta-label">Data de conclusão</span>
              <span class="meta-value">${formattedDate}</span>
            </div>
            <div class="meta-sep"></div>
            <div class="meta-col">
              <span class="meta-label">Instrutor</span>
              <span class="meta-value">${certificate.instructor_name || 'EduPlatform'}</span>
            </div>
            ${certificate.total_hours ? `
            <div class="meta-sep"></div>
            <div class="meta-col">
              <span class="meta-label">Carga horária</span>
              <span class="meta-value">${certificate.total_hours}h</span>
            </div>` : ''}
          </div>
        </div>

        <!-- Código de verificação -->
        <div class="verify">
          <span>Código de verificação: ${certificate.code}</span>
        </div>

      </div>
      </body></html>
    `;
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
    const canvas = await html2canvas(el, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1122, 794] });
    pdf.addImage(imgData, 'PNG', 0, 0, 1122, 794);
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