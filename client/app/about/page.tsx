import Image from "next/image";

export default function About() {
  return (
    <div className="flex flex-col items-center justify-between min-h-screen bg-gray-50 dark:bg-slate-900 px-4 pt-20 overflow-hidden transition-colors duration-300">
      <div className="text-center max-w-5xl px-4">
        <h1 className="text-5xl font-semibold tracking-tight text-gray-900 dark:text-slate-100">
          Welcome to <span className="text-red-600">Spark!</span> Bytes
        </h1>
        <p className="mx-auto text-lg mt-4 leading-relaxed text-gray-600 dark:text-slate-400">
          <span className="font-semibold text-gray-900 dark:text-slate-100">
            Spark!Bytes is an event made by BU students to help reduce the food waste and feed the BU community.
            Spark!Bytes connects hungry students with leftover event food in real time.
          </span>
          Browse upcoming food events across campus, claim portions before they're gone, or post your own event to share
          leftovers. Whether it's post-hackathon pizza or extra bagels from a meeting, Spark!Bytes makes sure good food
          never goes to waste.
        </p>
      </div>
      <Image src="/terrier_about.png" width={500} height={500} alt="terrier" />
      <footer className="min-w-screen bg-red-700 p-10">
        <p className="max-w-6xl mx-auto text-center text-white font-bold text-xl">
          Explore Events: See what's available near you by time, location, and food type. Post Leftovers: Hosting an
          event? <br />
          Share your surplus food to help fellow students and minimize waste.
        </p>
      </footer>
    </div>
  );
}
