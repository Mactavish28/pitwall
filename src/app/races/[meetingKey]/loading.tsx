import { InlineLoader } from "@/components/inline-loader";

export default function RaceRouteLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-8 lg:px-8 lg:py-10">
      <div className="panel rounded-[30px] p-6 lg:p-8">
        <InlineLoader
          label="Loading race overview..."
          className="rounded-[18px] border border-white/8 bg-white/[0.02]"
        />
      </div>
    </div>
  );
}
