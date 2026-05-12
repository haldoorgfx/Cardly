import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://qhjvetcawsaswfkufzee.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoanZldGNhd3Nhc3dma3VmemVlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODU2OTkzOCwiZXhwIjoyMDk0MTQ1OTM4fQ.nmrE67SKNpsC8K5Yacvqj-6TxzMOL-ctT3C_1t65IYs"
);

async function setup() {
  // Create event-backgrounds bucket (public read for the background image on attendee page)
  const { error: e1 } = await supabase.storage.createBucket(
    "event-backgrounds",
    { public: true, fileSizeLimit: 20971520 } // 20MB
  );
  if (e1 && !e1.message.includes("already exists"))
    console.error("event-backgrounds:", e1.message);
  else console.log("✓ event-backgrounds bucket ready");

  // Create generated-cards bucket (private, owner reads)
  const { error: e2 } = await supabase.storage.createBucket(
    "generated-cards",
    { public: false, fileSizeLimit: 20971520 }
  );
  if (e2 && !e2.message.includes("already exists"))
    console.error("generated-cards:", e2.message);
  else console.log("✓ generated-cards bucket ready");
}

setup();
