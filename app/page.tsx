import GameCanvas from "./components/GameCanvas";

export default function Home() {
  return (
    <section className="flex flex-col items-center justify-center w-full h-full overflow-hidden">
      <GameCanvas />
    </section>
  );
}
