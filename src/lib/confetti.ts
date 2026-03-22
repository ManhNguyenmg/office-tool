import confetti from "canvas-confetti";

export const fireConfetti = () => {
  confetti({
    particleCount: 150,
    spread: 80,
    origin: { y: 0.6 },
    colors: ["#3B82F6", "#FBBF24", "#F472B6", "#34D399"],
  });
};
