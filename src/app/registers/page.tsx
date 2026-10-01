import type { Metadata } from "next";
import { RegistersClient } from "./registers-client";

export const metadata: Metadata = {
  title: "Registers",
};

export default function RegistersPage() {
  return <RegistersClient />;
}
