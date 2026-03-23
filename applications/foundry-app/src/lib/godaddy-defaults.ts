import type { ChecklistItem } from "@/types/database";

export const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { key: "wordpress_installed", label: "WordPress Installed", done: false },
  { key: "avada_installed", label: "Avada Theme Installed", done: false },
  { key: "ssl_configured", label: "SSL Certificate Configured", done: false },
  { key: "dns_configured", label: "DNS Configured", done: false },
  { key: "admin_access_granted", label: "Admin Access Granted to Client", done: false },
  { key: "handover_complete", label: "Handover Complete", done: false },
];
