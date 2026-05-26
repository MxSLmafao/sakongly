import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AppearanceSettings } from "./Appearance";
import { ProvidersSettings } from "./Providers";
import { ShortcutsSettings } from "./Shortcuts";
import { PromptsSettings } from "./Prompts";
import { ScreenshotSettings } from "./Screenshot";

export function Settings() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden p-6">
      <h1 className="text-lg font-semibold mb-4">Settings</h1>
      <Tabs defaultValue="appearance" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="shrink-0 justify-start mb-4">
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="shortcuts">Shortcuts</TabsTrigger>
          <TabsTrigger value="prompts">Prompts</TabsTrigger>
          <TabsTrigger value="screenshot">Screenshot</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="appearance"><AppearanceSettings /></TabsContent>
          <TabsContent value="providers"><ProvidersSettings /></TabsContent>
          <TabsContent value="shortcuts"><ShortcutsSettings /></TabsContent>
          <TabsContent value="prompts"><PromptsSettings /></TabsContent>
          <TabsContent value="screenshot"><ScreenshotSettings /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
