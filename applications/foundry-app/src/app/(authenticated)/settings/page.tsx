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

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

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
