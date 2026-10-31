import { listSounds } from "@/lib/sounds";
import { Desktop } from "./Desktop";

export default async function ToughbookHome() {
  const sounds = await listSounds();
  return <Desktop sounds={sounds} />;
}
