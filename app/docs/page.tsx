"use client";

// Documentation — how the deterministic guidelines-graph engine works, end to end.
// 3-column OpenAI-docs layout (category nav · content · on-this-page), our DS.

import DocsLayout from "@/app/components/docs/DocsLayout";
import Introduction from "@/app/components/docs/sections/Introduction";
import Data from "@/app/components/docs/sections/Data";
import Model from "@/app/components/docs/sections/Model";
import Resolution from "@/app/components/docs/sections/Resolution";
import Generation from "@/app/components/docs/sections/Generation";
import Architecture from "@/app/components/docs/sections/Architecture";

export default function DocsPage() {
  return (
    <DocsLayout>
      <Introduction />
      <Data />
      <Model />
      <Resolution />
      <Generation />
      <Architecture />
    </DocsLayout>
  );
}
