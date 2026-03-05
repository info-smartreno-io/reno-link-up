import { useSlotImage } from "@/hooks/useSlotImage";

export default function ExampleIntegration() {
  // Example: Use the home hero image
  const { imageUrl: homeHeroImage } = useSlotImage("home_hero", "/stock/home-hero.jpg");
  
  // Example: Use the kitchen hero image
  const { imageUrl: kitchenImage } = useSlotImage("kitchen_hero", "/stock/kitchen-hero.jpg");

  return (
    <div className="space-y-8 p-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Home Hero Image Example</h2>
        <div className="aspect-video bg-muted rounded-lg overflow-hidden">
          <img
            src={homeHeroImage}
            alt="Home renovation hero"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Kitchen Hero Image Example</h2>
        <div className="aspect-video bg-muted rounded-lg overflow-hidden">
          <img
            src={kitchenImage}
            alt="Kitchen renovation hero"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}
