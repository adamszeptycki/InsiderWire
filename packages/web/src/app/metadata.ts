import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Last 10 - Answer Any Question About Your Company Data",
  description: "Transform your business data into actionable insights with Last 10. Ask questions in natural language and get instant, accurate answers powered by advanced AI.",
  keywords: "AI, business intelligence, data analytics, natural language processing, company data, insights",
  openGraph: {
    title: "Last 10 - Answer Any Question About Your Company Data",
    description: "Transform your business data into actionable insights with Last 10.",
    type: "website",
    url: "https://Lucidiant-ai.com",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Last 10",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Last 10 - Answer Any Question About Your Company Data",
    description: "Transform your business data into actionable insights with Last 10.",
    images: ["/og-image.png"],
  },
};