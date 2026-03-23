import { getAllSettings, updateSetting } from "@/lib/settings";

export default async function SettingsPage() {
  const settings = await getAllSettings();

  // Group settings by prefix
  const promptSettings = settings.filter((s) => s.key.startsWith("prompt_"));
  const orgSettings = settings.filter((s) => s.key.startsWith("org_"));
  const otherSettings = settings.filter(
    (s) => !s.key.startsWith("prompt_") && !s.key.startsWith("org_")
  );

  const formatLabel = (key: string) =>
    key
      .replace(/^prompt_/, "")
      .replace(/^org_/, "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  // Read .env.local directly to check key status (turbopack doesn't reliably expose non-NEXT_PUBLIC_ vars)
  let envContent = "";
  try {
    const fs = require("fs");
    const path = require("path");
    envContent = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
  } catch {
    // .env.local doesn't exist
  }
  const hasEnvKey = (key: string) => envContent.includes(`${key}=`) && !envContent.includes(`${key}=\n`);

  const apiKeys = [
    { name: "Anthropic API", env: "ANTHROPIC_API_KEY", configured: hasEnvKey("ANTHROPIC_API_KEY"), url: "https://console.anthropic.com/settings/keys" },
    { name: "Brave Search", env: "BRAVE_SEARCH_API_KEY", configured: hasEnvKey("BRAVE_SEARCH_API_KEY"), url: "https://brave.com/search/api/" },
    { name: "Supabase", env: "NEXT_PUBLIC_SUPABASE_URL", configured: hasEnvKey("NEXT_PUBLIC_SUPABASE_URL"), url: "https://supabase.com/dashboard" },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* API Keys Status */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4 border-b pb-2">
          API Keys Status
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          API keys are configured in <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">.env.local</code> — never stored in the database for security.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {apiKeys.map((key) => (
            <div
              key={key.name}
              className="flex items-center gap-2 p-3 rounded-lg border"
              style={{
                borderColor: key.configured ? "var(--green, #22c55e)" : "var(--border)",
                background: key.configured ? "rgba(34, 197, 94, 0.05)" : "var(--bg-secondary)",
              }}
            >
              <span className="text-lg">{key.configured ? "✅" : "⚠️"}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{key.name}</p>
                  <a
                    href={key.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs hover:underline"
                    style={{ color: "var(--accent)" }}
                  >
                    Get key →
                  </a>
                </div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {key.configured ? "Configured" : `Not set — add ${key.env} to .env.local`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Organization Settings */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4 border-b pb-2">
          Organization
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          These details are included as context in every consulting session so
          the AI understands your business, methodology, and standards.
        </p>
        <div className="space-y-6">
          {orgSettings.map((setting) => (
            <SettingEditor key={setting.id} setting={setting} label={formatLabel(setting.key)} />
          ))}
        </div>
      </section>

      {/* Consulting Prompts */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4 border-b pb-2">
          Consulting Prompts
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Edit the AI instructions for each session type. The base prompt
          applies to all sessions. Type-specific prompts are appended after it.
          Client context, project scope, and session history are injected
          automatically — you don&apos;t need to mention them here.
        </p>
        <div className="space-y-6">
          {/* Show base first, then alphabetical */}
          {[
            ...promptSettings.filter((s) => s.key === "prompt_base"),
            ...promptSettings
              .filter((s) => s.key !== "prompt_base")
              .sort((a, b) => a.key.localeCompare(b.key)),
          ].map((setting) => (
            <SettingEditor
              key={setting.id}
              setting={setting}
              label={
                setting.key === "prompt_base"
                  ? "Base Prompt (all sessions)"
                  : formatLabel(setting.key) + " Session"
              }
            />
          ))}
        </div>
      </section>

      {/* Other Settings */}
      {otherSettings.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Other</h2>
          <div className="space-y-6">
            {otherSettings.map((setting) => (
              <SettingEditor key={setting.id} setting={setting} label={formatLabel(setting.key)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SettingEditor({
  setting,
  label,
}: {
  setting: { id: string; key: string; value: string; description: string | null };
  label: string;
}) {
  return (
    <form action={updateSetting} className="bg-white border rounded-lg p-4">
      <input type="hidden" name="key" value={setting.key} />
      <div className="flex items-center justify-between mb-2">
        <label className="font-medium text-sm">{label}</label>
        <span className="text-xs text-gray-400 font-mono">{setting.key}</span>
      </div>
      {setting.description && (
        <p className="text-xs text-gray-500 mb-2">{setting.description}</p>
      )}
      <textarea
        name="value"
        defaultValue={setting.value}
        rows={setting.value.split("\n").length > 3 ? Math.min(setting.value.split("\n").length + 1, 15) : 3}
        className="w-full border rounded p-3 text-sm font-mono leading-relaxed"
      />
      <div className="flex justify-end mt-2">
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </form>
  );
}
