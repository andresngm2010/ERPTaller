import { runtimeMessage } from "@/src/runtime-message";

export default function Home() {
  return (
    <main>
      <h1>ERP Taller Automotriz</h1>
      <p>{runtimeMessage()}</p>
    </main>
  );
}
