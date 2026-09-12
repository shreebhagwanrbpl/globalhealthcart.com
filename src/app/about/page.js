"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import PageBanner from "@/components/PageBanner";
import SectionTitle from "@/components/SectionTitle";
import {
  ShieldCheck,
  Building2,
  Award,
  Users,
  CheckCircle2,
  ArrowRight,
  Target,
  Eye,
  Heart,
  Activity,
  Microscope,
} from "lucide-react";

const values = [
  {
    title: "Uncompromising Accuracy",
    desc: "We adhere strictly to NABL and ISO 13485 calibration guidelines so healthcare providers can diagnose patients with absolute confidence.",
    icon: Award,
  },
  {
    title: "24/7 Rapid Field Support",
    desc: "Our nationwide network of factory-trained biomedical engineers ensures zero diagnostic downtime for hospitals and ICUs.",
    icon: ShieldCheck,
  },
  {
    title: "Innovation & Technology",
    desc: "We partner with leading global medical device manufacturers to bring automated, AI-assisted diagnostic analyzers to Indian laboratories.",
    icon: Microscope,
  },
  {
    title: "Customer-Centric Integrity",
    desc: "Transparent pricing, comprehensive AMC warranty terms, and dedicated after-sales support form the cornerstone of our long-term client relationships.",
    icon: Heart,
  },
];

const milestones = [
  { year: "2014", title: "Company Foundation", desc: "Started operations as a specialized medical equipment supplier in Jaipur, India." },
  { year: "2017", title: "NABL Calibration Unit", desc: "Expanded into certified calibration & testing services for pathology analyzers." },
  { year: "2020", title: "Cold-Chain Reagent Logistics", desc: "Launched dedicated temperature-monitored reagent distribution across North India." },
  { year: "2024+", title: "5,000+ Healthcare Partners", desc: "Serving top multispecialty hospitals, diagnostic chains, and medical institutions." },
];

export default function AboutPage() {
  const pathname = usePathname();
  const pathParts = pathname.split("/").filter(Boolean);
  const staticRoutes = ["about", "services", "products", "contact", "items"];
  const district =
    pathParts.length > 0 && !staticRoutes.includes(pathParts[0])
      ? pathParts[0]
      : "";

  const makeLink = (path) => {
    if (!district) return path;
    if (path === "/") return `/${district}`;
    return `/${district}${path}`;
  };

  return (
    <div className="bg-[#FAF5EE] text-[#38240D]">
      {/* Banner */}
      <PageBanner
        badge="Who We Are"
        title="Building Better Diagnostic Workflows"
        subtitle="Empowering healthcare professionals through state-of-the-art biomedical instruments, NABL-traceable calibration, and 24/7 technical engineering support."
      />

      {/* Main Story Section */}
      <section className="section-padding bg-gradient-to-b from-white via-[#FAF5EE] to-[#F5ECE1]">
        <div className="container-custom">
          <div className="grid lg:grid-cols-12 gap-16 items-center">
            {/* Left Image Graphic */}
            <div className="lg:col-span-6 relative">
              <div className="relative overflow-hidden rounded-[36px] border border-[#E4D2C0] bg-white p-3 shadow-xl shadow-[#9E532B]/10">
                <Image
                  src="/about-facility.jpg"
                  alt="Raj Biosis Modern Diagnostic Laboratory & Biomedical Engineering Facility"
                  width={1000}
                  height={750}
                  className="w-full h-auto rounded-[28px] object-cover transition duration-500 hover:scale-105"
                />
              </div>

              {/* Floating Stat Badge */}
              <div className="absolute -bottom-6 -right-6 hidden sm:flex items-center gap-4 rounded-3xl border border-[#E4D2C0] bg-white p-6 shadow-2xl">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#9E532B] text-white font-black text-2xl shadow-md">
                  10+
                </div>
                <div>
                  <h4 className="text-lg font-bold text-[#38240D]">Years Experience</h4>
                  <p className="text-xs text-[#6B5645]">Trusted Biomedical Partner</p>
                </div>
              </div>
            </div>

            {/* Right Story Text */}
            <div className="lg:col-span-6">
              <SectionTitle
                badge="Our Legacy"
                title="Trusted Partner in Medical & Diagnostic Engineering"
                description="Raj Biosis Private Limited (Raj Biomedical) was founded with a singular mission: to provide Indian hospitals and laboratories with reliable, world-class diagnostic technology backed by instant field service."
              />

              <div className="mt-8 space-y-4 text-base sm:text-lg leading-relaxed text-[#6B5645]">
                <p>
                  Over the past decade, we have grown from a regional equipment supplier into a nationwide biomedical solution provider. We specialize in fully automated clinical chemistry analyzers, hematology counters, PCR systems, and ICU patient monitoring setups.
                </p>

                <p>
                  Our strength lies not only in our high-precision product portfolio, but in our certified engineering team. We ensure that every instrument delivered operates at peak calibration accuracy and complies with international medical safety standards.
                </p>
              </div>

              <div className="mt-8 grid sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 rounded-2xl border border-[#E4D2C0] bg-white p-4 shadow-sm">
                  <CheckCircle2 size={20} className="text-[#9E532B] shrink-0" />
                  <span className="text-sm font-bold text-[#38240D]">NABL Traceable QC</span>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-[#E4D2C0] bg-white p-4 shadow-sm">
                  <CheckCircle2 size={20} className="text-[#9E532B] shrink-0" />
                  <span className="text-sm font-bold text-[#38240D]">2-Hour SLA Maintenance</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="section-padding bg-white border-y border-[#E4D2C0]">
        <div className="container-custom">
          <SectionTitle
            badge="Strategic Purpose"
            title="Driven by Purpose, Guided by Science"
            description="Our organizational commitment is built upon clear diagnostic benchmarks and patient-first engineering."
            center
          />

          <div className="mt-14 grid gap-8 md:grid-cols-2">
            <div className="rounded-3xl border border-[#E4D2C0] bg-gradient-to-br from-[#FAF5EE] to-white p-8 sm:p-10 shadow-md">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#9E532B] text-white shadow-md">
                <Target size={28} />
              </div>

              <h3 className="text-2xl font-bold text-[#38240D]">Our Mission</h3>

              <p className="mt-4 text-base leading-relaxed text-[#6B5645]">
                To empower healthcare facilities with state-of-the-art diagnostic tools, zero-downtime maintenance contracts, and continuous technical training—ensuring every patient receives accurate, timely lab results.
              </p>

              <ul className="mt-6 space-y-2.5 text-sm text-[#6B5645]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#9E532B]" />
                  <span>Deliver certified automated analyzers nationwide</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#9E532B]" />
                  <span>Maintain guaranteed 24/7 service response SLAs</span>
                </li>
              </ul>
            </div>

            <div className="rounded-3xl border border-[#E4D2C0] bg-gradient-to-br from-[#F5ECE1] to-white p-8 sm:p-10 shadow-md">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7D3B17] text-white shadow-md">
                <Eye size={28} />
              </div>

              <h3 className="text-2xl font-bold text-[#38240D]">Our Vision</h3>

              <p className="mt-4 text-base leading-relaxed text-[#6B5645]">
                To be recognized as India's premier biomedical technology and calibration infrastructure company, setting the benchmark for precision, innovation, and customer support in diagnostic healthcare.
              </p>

              <ul className="mt-6 space-y-2.5 text-sm text-[#6B5645]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#9E532B]" />
                  <span>Expand cold-chain distribution to every tier-2 & tier-3 city</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#9E532B]" />
                  <span>Pioneer AI-assisted remote analyzer diagnostics</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values Grid */}
      <section className="section-padding bg-gradient-to-b from-[#FAF5EE] via-white to-[#F5ECE1]">
        <div className="container-custom">
          <SectionTitle
            badge="Our Foundation"
            title="Core Values That Drive Our Engineering"
            description="Every instrument we calibrate and every hospital we support reflects our dedication to these four pillars."
            center
          />

          <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {values.map((val, idx) => {
              const Icon = val.icon;
              return (
                <div
                  key={idx}
                  className="group rounded-3xl border border-[#E4D2C0] bg-white p-8 shadow-md transition-all duration-300 hover:-translate-y-2 hover:border-[#9E532B]/50 hover:shadow-xl"
                >
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F6ECE3] text-[#9E532B] transition-colors group-hover:bg-[#9E532B] group-hover:text-white border border-[#E4D2C0]/50">
                    <Icon size={28} />
                  </div>

                  <h4 className="text-xl font-bold text-[#38240D] group-hover:text-[#9E532B] transition-colors">
                    {val.title}
                  </h4>

                  <p className="mt-3 text-sm leading-relaxed text-[#6B5645]">
                    {val.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Growth Milestones Timeline */}
      <section className="section-padding bg-white border-t border-[#E4D2C0]">
        <div className="container-custom">
          <SectionTitle
            badge="Company Timeline"
            title="Milestones in Biomedical Excellence"
            description="A journey of constant expansion, technological upgrades, and unwavering customer satisfaction."
            center
          />

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {milestones.map((m, idx) => (
              <div
                key={idx}
                className="relative overflow-hidden rounded-3xl border border-[#E4D2C0] bg-[#FAF5EE] p-8 shadow-sm transition-all hover:border-[#9E532B]/50 hover:shadow-md"
              >
                <span className="text-4xl font-black text-[#9E532B]">
                  {m.year}
                </span>
                <h4 className="mt-4 text-xl font-bold text-[#38240D]">{m.title}</h4>
                <p className="mt-2 text-xs sm:text-sm text-[#6B5645] leading-relaxed">
                  {m.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-[#2C1809] via-[#38240D] to-[#2C1809] py-16 text-white text-center">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Ready to Upgrade Your Laboratory Technology?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#E4D2C0]/90">
            Consult with our biomedical engineering specialists for custom equipment recommendations and instant pricing.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href={makeLink("/contact")}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#9E532B] px-8 py-4 text-base font-bold text-white shadow-lg transition-all hover:bg-[#7D3B17]"
            >
              <span>Contact Engineering Team</span>
              <ArrowRight size={18} />
            </Link>

            <Link
              href={makeLink("/items")}
              className="inline-flex items-center gap-2 rounded-2xl border border-[#E4D2C0] bg-white/10 px-8 py-4 text-base font-bold text-white shadow-sm transition-all hover:bg-white/20"
            >
              <span>Browse Equipment Catalog</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}