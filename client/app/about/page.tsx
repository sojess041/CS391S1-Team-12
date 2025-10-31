export default function About() {
  return (
    <div className="flex flex-col items-center justify-between min-h-screen pt-20 overflow-hidden">
      <div className="">
        <h1 className="text-5xl uppercase font-bold text-center">
          Welcome to <span className="text-red-600">Spark!</span> Bytes
        </h1>
        <p className="mx-auto text-lg mt-4 max-w-5xl px-4 text-center leading-relaxed">
          <span className="font-bold">
            Spark!Bytes is an event made by BU student to help reduce the food waste and feed the BU community.
            Spark!Bytes connects hungry students with leftover event food in real time.
          </span>
          Browse upcoming food events across campus, claim portions before they’re gone, or post your own event to share
          leftovers. Whether it’s post-hackathon pizza or extra bagels from a meeting, Spark!Bytes makes sure good food
          never goes to waste.
        </p>
      </div>
      <footer className="min-w-screen bg-red-600 p-10">
        <p className="max-w-6xl mx-auto text-center text-white font-bold text-xl">
          Explore Events: See what’s available near you by time, location, and food type. Post Leftovers: Hosting an
          event? <br />
          Share your surplus food to help fellow students and minimize waste.
        </p>
      </footer>
    </div>
  );
}
