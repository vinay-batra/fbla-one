import "./mock.css";

export const metadata = {
  title: "Mock Regionals",
  robots: { index: false, follow: false },
};

export default function MockLayout({ children }: { children: React.ReactNode }) {
  return children;
}
