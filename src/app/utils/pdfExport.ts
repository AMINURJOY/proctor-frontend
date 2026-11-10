import julyRegular from '../../assets/fonts/July-Regular.ttf';
import julyBold from '../../assets/fonts/July-Bold.ttf';
import { toast } from 'sonner';
import { Case, User } from '../types';
import { API_BASE_URL } from '../services/api';

const abs = (url: string) => new URL(url, window.location.origin).href;
export const BANGLA_FONT_STACK = `'July', 'Noto Sans Bengali', Arial, sans-serif`;
const JULY_RANGE = `U+0980-09FF, U+0964-0965, U+200C-200D, U+25CC`;
const JULY_FACE_CSS = `
  @font-face { font-family: 'July'; src: url('${abs(julyRegular)}') format('truetype'); font-weight: 400; font-style: normal; unicode-range: ${JULY_RANGE}; }
  @font-face { font-family: 'July'; src: url('${abs(julyBold)}') format('truetype'); font-weight: 700; font-style: normal; unicode-range: ${JULY_RANGE}; }
`;

type ReportImage = { src: string; alt: string };

const isReportLogo = (src: string, alt: string) =>
  src.toLowerCase().includes('report_logo') || alt.trim().toLowerCase() === 'logo';

export const resolveDocumentUrl = (url: string) => url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')
  ? url
  : `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;

/**
 * Keep the official report logo in the header, but collect every evidence image into
 * one compact four-column gallery at the very end of the report. Case image documents
 * are included even when the officer did not manually insert them into the editor.
 */
export function arrangeReportImagesAtEnd(html: string, documents: Case['documents'] = []): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html || '', 'text/html');
  const collected: ReportImage[] = [];
  const imageTables = new Set<HTMLTableElement>();

  for (const table of Array.from(doc.body.querySelectorAll<HTMLTableElement>('table.report-image-grid, table[data-report-image-grid="true"]'))) {
    imageTables.add(table);
  }
  for (const heading of Array.from(doc.body.querySelectorAll('h3'))) {
    if (!/evidence images|সংযুক্ত ছবিসমূহ/i.test(heading.textContent || '')) continue;
    if (heading.nextElementSibling?.tagName === 'TABLE') imageTables.add(heading.nextElementSibling as HTMLTableElement);
  }

  for (const image of Array.from(doc.body.querySelectorAll('img'))) {
    const src = image.getAttribute('src')?.trim() || '';
    const alt = image.getAttribute('alt')?.trim() || 'Evidence image';
    if (!src || isReportLogo(src, alt)) continue;
    collected.push({ src: resolveDocumentUrl(src), alt });
    const table = image.closest('table');
    if (!table || !imageTables.has(table)) {
      const parent = image.parentElement;
      image.remove();
      if (parent && parent.tagName === 'P' && !parent.textContent?.trim() && parent.children.length === 0) parent.remove();
    }
  }

  // A previous gallery is rebuilt on every save/export so this operation remains idempotent.
  for (const table of imageTables) {
    const previous = table.previousElementSibling;
    table.remove();
    if (previous?.tagName === 'H3' && /evidence images|সংযুক্ত ছবিসমূহ/i.test(previous.textContent || '')) previous.remove();
  }

  for (const document of documents.filter(item => item.type === 'image' && item.url)) {
    collected.push({ src: resolveDocumentUrl(document.url), alt: document.name || 'Evidence image' });
  }

  const unique = collected.filter((image, index, all) =>
    all.findIndex(candidate => candidate.src === image.src) === index);
  if (unique.length === 0) return doc.body.innerHTML;

  const heading = doc.createElement('h3');
  heading.textContent = /[\u0980-\u09FF]/.test(doc.body.textContent || '') ? 'সংযুক্ত ছবিসমূহ' : 'Evidence Images';
  doc.body.appendChild(heading);

  const table = doc.createElement('table');
  table.className = 'report-image-grid';
  table.setAttribute('data-report-image-grid', 'true');
  const body = doc.createElement('tbody');
  for (let index = 0; index < unique.length; index += 4) {
    const row = doc.createElement('tr');
    for (let column = 0; column < 4; column++) {
      const cell = doc.createElement('td');
      const item = unique[index + column];
      if (item) {
        const image = doc.createElement('img');
        image.src = item.src;
        image.alt = item.alt;
        image.loading = 'lazy';
        const caption = doc.createElement('p');
        const link = doc.createElement('a');
        link.href = item.src;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.title = `Open ${item.alt}`;
        link.appendChild(image);
        const captionLink = doc.createElement('a');
        captionLink.href = item.src;
        captionLink.target = '_blank';
        captionLink.rel = 'noopener noreferrer';
        captionLink.textContent = item.alt;
        caption.appendChild(captionLink);
        cell.append(link, caption);
      }
      row.appendChild(cell);
    }
    body.appendChild(row);
  }
  table.appendChild(body);
  doc.body.appendChild(table);
  return doc.body.innerHTML;
}

export function generateReportHTML(caseItem: Case, reportCreator?: Pick<User, 'name' | 'email' | 'rank'> | null): string {
  const sharifaCreated = !!reportCreator && (
    reportCreator.email?.toLowerCase() === 'sharifa@daffodilvarsity.edu.bd'
    || reportCreator.name.toLowerCase().includes('sharifa sultana')
  );
  const signer = sharifaCreated
    ? { name: reportCreator!.name, designation: 'অধ্যাপক ও উপ-প্রক্টর' }
    : { name: 'Dr. Shaikh Muhammad Allayear', designation: 'অধ্যাপক ও প্রক্টর' };
  const latestHearing = [...(caseItem.hearings || [])]
    .filter(hearing => hearing.status === 'completed')
    .sort((a, b) => String(b.conductedAt || b.date).localeCompare(String(a.conductedAt || a.date)))[0];
  const reportValue = (value?: string | null) => value?.trim()
    ? value.trim().replace(/\n/g, '<br>')
    : '[তথ্য যোগ করুন]';
  const cr = (caseItem.complainants || []).map(c =>
    `<tr><td>${c.name}</td><td>${c.studentId}</td><td>${c.department || '-'}</td></tr>`
  ).join('') || '<tr><td colspan="3">-</td></tr>';
  const ar = (caseItem.accusedPersons || []).map(a =>
    `<tr><td>${a.name}</td><td>${a.accusedStudentId}</td><td>${a.department || '-'}</td></tr>`
  ).join('') || '<tr><td colspan="3">-</td></tr>';
  const seen = new Set<string>();
  const pr = (caseItem.timeline || [])
    .filter(e => { if (seen.has(e.user)) return false; seen.add(e.user); return e.user !== 'System'; })
    .map(p => `<tr><td>${p.user}</td><td>${p.action}</td></tr>`)
    .join('') || '<tr><td colspan="2">[তদন্তকারীর নাম যোগ করুন]</td></tr>';
  const docs = (caseItem.documents || []).map((d, i) =>
    `<li>পরিশিষ্ট ${i + 1}ঃ <a href="${resolveDocumentUrl(d.url)}" target="_blank" rel="noopener noreferrer">${d.name}</a> (${d.type})</li>`
  ).join('') || '<li>কোনো সংযুক্তি নেই</li>';

  const report = `
<p style="text-align: center"><img src="/report_logo.png" alt="Logo"></p>
<h2 style="text-align: center"><u>তদন্ত প্রতিবেদন</u></h2>
<p style="text-align: center">Daffodil International University - Proctor Office</p>
<p></p>
<p><strong>মামলা নম্বর:</strong> ${caseItem.caseNumber}</p>
<p><strong>রিপোর্টের তারিখ:</strong> ${new Date().toLocaleDateString('bn-BD')}</p>
<p><strong>বিষয়:</strong> ${caseItem.description?.substring(0, 150) || '[বিষয় লিখুন]'}</p>
<p></p>
<h3>১। অভিযোগকারীদের তথ্য:</h3>
<table><thead><tr><th>নাম</th><th>আইডি</th><th>বিভাগ</th></tr></thead><tbody>${cr}</tbody></table>
<h3>২। অভিযুক্তের তথ্য:</h3>
<table><thead><tr><th>নাম</th><th>আইডি</th><th>বিভাগ</th></tr></thead><tbody>${ar}</tbody></table>
<h3>৩। তদন্ত পদ্ধতি এবং অংশগ্রহণকারী:</h3>
<ul><li><strong>তদন্ত কমিটির সভা:</strong> [তারিখ, স্থান এখানে লিখুন]</li><li><strong>তদন্ত পদ্ধতি:</strong> সরাসরি সাক্ষাৎকার, লিখিত অভিযোগ পর্যালোচনা এবং প্রমাণাদি বিশ্লেষণ</li></ul>
<h3>৪। তদন্তকারী:</h3>
<table><thead><tr><th>নাম</th><th>পদবী</th></tr></thead><tbody>${pr}</tbody></table>
<h3>৪.১। প্রতিবেদন প্রস্তুতকারী:</h3>
<table><thead><tr><th>নাম</th><th>পদবী</th></tr></thead><tbody><tr><td>${signer.name}</td><td>${signer.designation}</td></tr></tbody></table>
<h3>৫। ঘটনার পটভূমি ও অভিযোগসমূহ:</h3>
<p>${caseItem.description || '[ঘটনার বিস্তারিত বিবরণ এখানে লিখুন]'}</p>
<h3>৬। অভিযোগকারী/সাক্ষীদের বিবৃতি:</h3>
<p>${reportValue(latestHearing?.complainantStatement || latestHearing?.remarks)}</p>
<h3>৭। অভিযুক্তের বিবৃতি:</h3>
<p>${reportValue(latestHearing?.accusedStatement)}</p>
<p></p>
<h3>৮। বিশ্ববিদ্যালয়ের কোড অফ কন্ডাক্ট (ফলাফল):</h3>
<table><thead><tr><th>অনুচ্ছেদ নং</th><th>অনুচ্ছেদের নাম ও ব্যখ্যা</th></tr></thead><tbody><tr><td colspan="2"><em>[আর্টিকেল সিলেক্টর থেকে নির্বাচন করুন]</em></td></tr></tbody></table>
<h3>৯। সুপারিশ:</h3>
<p>[তদন্ত কমিটি নিম্নলিখিত সুপারিশ প্রদান করছে:]</p>
<ul><li>[সুপারিশ ১]</li><li>[সুপারিশ ২]</li><li>[সুপারিশ ৩]</li></ul>
<p></p>
<h3>১০। চূড়ান্ত সিদ্ধান্ত (Final Punishment):</h3>
<p>${caseItem.verdict ? caseItem.verdict.replace(/\n/g, '<br>') : '[ডিসিপ্লিনারি কমিটি চূড়ান্ত সিদ্ধান্ত প্রদান করবে]'}</p>
<p></p>
<h3>প্রক্টোরিয়াল সদস্য:</h3>
<table><thead><tr><th>নাম</th><th>পদবী</th><th>স্বাক্ষর</th></tr></thead><tbody><tr><td>[নাম]</td><td>[অধ্যাপক ও প্রক্টর]</td><td></td></tr><tr><td>[নাম]</td><td>[সহকারী প্রক্টর]</td><td></td></tr></tbody></table>
<h3>সংযুক্তি:</h3>
<ol>${docs}</ol>
<p></p>
<p style="text-align: center"><strong>ধন্যবাদ</strong></p>
<p style="text-align: center"><strong>${signer.name}</strong></p>
<p style="text-align: center">${signer.designation}</p>
<p style="text-align: center">ড্যাফোডিল ইন্টারন্যাশনাল ইউনিভার্সিটি</p>
`.trim();
  return arrangeReportImagesAtEnd(report, caseItem.documents || []);
}

export function getDisplayReportHTML(caseItem: Case): string {
  let content = caseItem.reports?.[0]?.content || generateReportHTML(caseItem);
  if (!caseItem.verdict) return arrangeReportImagesAtEnd(content, caseItem.documents || []);

  if (content.includes('[ডিসিপ্লিনারি কমিটি চূড়ান্ত সিদ্ধান্ত প্রদান করবে]')) {
    content = content.replace('[ডিসিপ্লিনারি কমিটি চূড়ান্ত সিদ্ধান্ত প্রদান করবে]', caseItem.verdict.replace(/\n/g, '<br>'));
  } else {
    content += `
      <div style="margin-top: 48px; border-top: 2px solid #ccc; padding-top: 24px;">
        <h3 style="font-weight: bold; font-size: 18px; margin-bottom: 12px; color: #0b2652;">চূড়ান্ত সিদ্ধান্ত (Final Punishment):</h3>
        <p style="white-space: pre-wrap; color: #1f2937; line-height: 1.6; font-size: 16px;">${caseItem.verdict}</p>
      </div>`;
  }
  return arrangeReportImagesAtEnd(content, caseItem.documents || []);
}

export async function inlineImagesAsBase64(html: string, maxWidth = 80): Promise<string> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const images = Array.from(doc.querySelectorAll('img'));

  for (const img of images) {
    const src = img.getAttribute('src');
    if (!src || src.startsWith('data:')) continue;
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Resize the image so it fits neatly into the report layout
      const resized = await new Promise<string>((resolve) => {
        const i = new Image();
        i.onload = () => {
          let { width, height } = i;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(i, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.85));
          } else resolve(base64);
        };
        i.onerror = () => resolve(base64);
        i.src = base64;
      });

      img.setAttribute('src', resized);
      img.removeAttribute('srcset');
    } catch {
      // Keep original src if fetch/conversion fails
    }
  }
  return doc.body.innerHTML;
}

export async function exportReportToPdf(html: string, caseNumber: string) {
  try {
    const inlined = await inlineImagesAsBase64(arrangeReportImagesAtEnd(html));
    const win = window.open('', '_blank', 'width=900,height=1100');
    if (!win) {
      toast.error('Pop-up blocked', { description: 'Allow pop-ups to export PDF' });
      return;
    }
    const docHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>report-${caseNumber || 'case'}</title>
<style>
  ${JULY_FACE_CSS}
  @page { size: A4; margin: 0.75in; }
  body { font-family: ${BANGLA_FONT_STACK}; font-size: 14px; line-height: 1.6; color: #000; margin: 0; padding: 0; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; page-break-inside: avoid; }
  th, td { border: 1px solid #000; padding: 8px; text-align: left; font-size: 14px; }
  th { background: #f2f2f2; font-weight: bold; }
  h2 { font-size: 22px; margin: 8px 0; }
  h3 { font-size: 16px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 4px; margin: 20px 0 10px; page-break-after: avoid; }
  img { max-width: 120px; display: block; margin: 0 auto; }
  .report-image-grid { width: 100%; table-layout: fixed; page-break-inside: auto; }
  .report-image-grid tr { page-break-inside: avoid; }
  .report-image-grid td { width: 25%; padding: 5px; text-align: center; vertical-align: top; }
  .report-image-grid img { width: 105px; height: 78px; object-fit: cover; margin: 0 auto 3px; }
  .report-image-grid p { margin: 0; font-size: 9px; line-height: 1.2; overflow-wrap: anywhere; }
  p { margin: 4px 0; }
  ul { list-style: disc outside; padding-left: 28px; margin: 8px 0; }
  ol { list-style: decimal outside; padding-left: 28px; margin: 8px 0; }
  ul ul { list-style: circle outside; }
  li { margin: 2px 0; padding-left: 4px; }
  blockquote { border-left: 3px solid #ddd; padding-left: 12px; color: #555; }
</style></head><body>${inlined}
<script>
  window.onload = function() {
    setTimeout(function() { window.focus(); window.print(); }, 300);
  };
  window.onafterprint = function() { window.close(); };
</script>
</body></html>`;
    win.document.open();
    win.document.write(docHtml);
    win.document.close();
    toast.success('PDF dialog opened — choose "Save as PDF"');
  } catch (err: any) {
    toast.error('PDF export failed', { description: err?.message || 'Could not export' });
  }
}
