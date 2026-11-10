/** R282: public, opt-in GitHub Issues intake. No credentials or direct GitHub API writes in the browser.
 * GitHub Issue is NOT created until the author confirms on github.com.
 * Never use this for private feelings/ideas, nor bulk-export pre-existing notes.
 */
import type { NoteR171 } from './noor-three-spaces-r171.js';

export const NOOR_DEVELOPER_GITHUB_REPO_R282 = 'engaboali9226-mastoura/work-tracker_OS' as const;
export const NOOR_DEVELOPER_GITHUB_ISSUES_R282 =
  'https://github.com/engaboali9226-mastoura/work-tracker_OS/issues' as const;

export type NoorDeveloperIssueInputR282 =
  Readonly<Pick<NoteR171,'kind'|'title'|'body'|'category'>>;

const ISSUE_CATEGORY_R282: Readonly<Record<string,string>> = {
 improvement:'اقتراح تطوير',issue:'بلاغ عن مشكلة',efficiency:'تحسين الكفاءة',
 ux:'تحسين تجربة الاستخدام',other:'ملاحظة أخرى',
};

export function createNoorDeveloperGitHubIssueUrlR282(
  note: NoorDeveloperIssueInputR282, explicitPublicConsent: boolean,
): string {
  if(explicitPublicConsent!==true) throw new Error('NOOR_GITHUB_PUBLIC_CONSENT_REQUIRED');
  if(note.kind!=='developer') throw new Error('NOOR_GITHUB_DEVELOPER_ONLY');
  if(typeof note.title!=='string'||typeof note.body!=='string'||typeof note.category!=='string')
    throw new Error('NOOR_GITHUB_INVALID_NOTE');
  const title=note.title.trim(),body=note.body.trim();
  if(!title||title.length>100||!body||body.length>4000)
    throw new Error('NOOR_GITHUB_INVALID_NOTE');
  const category=ISSUE_CATEGORY_R282[note.category];
  if(!category) throw new Error('NOOR_GITHUB_INVALID_CATEGORY');
  const params=new URLSearchParams({
    title:'[NOOR Development] '+title,
    body:'## النوع\n'+category+'\n\n## وصف المشكلة أو المقترح\n'+body+
      '\n\n---\nأُرسلت هذه الملاحظة عبر واجهة «تطوير نور» بموافقة صاحبها على النشر العام. لا تتضمن هذه العملية بيانات حساب نور أو تدويناته الخاصة.',
  });
  const url=NOOR_DEVELOPER_GITHUB_ISSUES_R282+'/new?'+params.toString();
  // GitHub rejects excessively long GET links. Never silently truncate user-authored notes.
  if(url.length>7000) throw new Error('NOOR_GITHUB_ISSUE_URL_TOO_LONG');
  return url;
}
