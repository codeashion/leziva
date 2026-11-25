import { NextResponse } from "next/server";
import { PRODUCTS } from "@/lib/constants";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const fabric = searchParams.get("fabric");
  const sort = searchParams.get("sort");

  let list = [...PRODUCTS];

  if (category) {
    list = list.filter((p) => p.category === category || p.categoryDisplayName.toLowerCase() === category.toLowerCase());
  }
  if (fabric) {
    list = list.filter((p) => p.fabric.toLowerCase().includes(fabric.toLowerCase()));
  }
  if (sort === "price-low") {
    list.sort((a, b) => a.price - b.price);
  } else if (sort === "price-high") {
    list.sort((a, b) => b.price - a.price);
  } else if (sort === "rating") {
    list.sort((a, b) => b.rating - a.rating);
  }

  return NextResponse.json({
    success: true,
    total: list.length,
    products: list,
  });
}
