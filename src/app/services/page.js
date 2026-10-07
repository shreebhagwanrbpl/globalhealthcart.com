"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import PageBanner from "@/components/PageBanner";
import SectionTitle from "@/components/SectionTitle";
import ServiceCard from "@/components/ServiceCard";
import {
  Microscope,
  FlaskConical,
  ShieldCheck,
  Stethoscope,
  Wrench,
  Activity,
  Award,
  Zap,
  CheckCircle2,
  PhoneCall,
  FileCheck,
  Cpu,
} from "lucide-react";
import { fallbackServices } from "@/data/servicesData";

const workflowSteps = [
  {
    step: "01",
    title: "Diagnostic Audit & Consultation",
    desc: "We analyze your hospital sample load, space constraints, and technical requirements to select the exact analyzer configuration.",
    icon: FileCheck,
  },
  {
    step: "02",
    title: "Precision Solution Engineering",
    desc: "Custom lab layout designs, power backup specifications, and reagent supply schedule formulation.",
    icon: Cpu,
  },
  {
    step: "03",
    title: "Installation & NABL Calibration",
    desc: "Certified engineers perform physical installation, IQ/OQ/PQ protocols, and NABL-traceable reference calibration.",
    icon: Award,
  },
  {
    step: "04",
    title: "24/7 SLA Field Maintenance",
    desc: "Round-the-clock technical emergency support, scheduled preventive maintenance visits, and automated reagent restocking.",
    icon: Zap,
  },
];

import { doc, getDoc, db } from "@/lib/admin-data";

export default function ServicesPage() {
  const [services, setServices] = useState(() => fallbackServices);
  const [pageData, setPageData] = useState(null);
  const [contactInfo, setContactInfo] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const icons = [
    <Microscope size={28} key={1} />,
    <FlaskConical size={28} key={2} />,
    <ShieldCheck size={28} key={3} />,
    <Stethoscope size={28} key={4} />,
    <Wrench size={28} key={5} />,
    <Activity size={28} key={6} />,
  ];

  useEffect(() => {
    const fetchServicesAndContact = async () => {
      try {
        const [servicesSnap, contactSnap] = await Promise.allSettled([
          getDoc(doc(db, "websites", "globalhealthcartcom", "pages", "services")),
          getDoc(doc(db, "websites", "globalhealthcartcom", "pages", "contact")),
        ]);

        if (servicesSnap.status === "fulfilled" && servicesSnap.value?.exists()) {
          const data = servicesSnap.value.data();
          setPageData(data);
          if (Array.isArray(data.services) && data.services.length > 0) {
            setServices(data.services);
          }
        }

        if (contactSnap.status === "fulfilled" && contactSnap.value?.exists()) {
          setContactInfo(contactSnap.value.data()?.contactInfo || []);
        }
      } catch (error) {
        console.warn("Error background loading services/contact data:", error);
      }
    };

    fetchServicesAndContact();
  }, []);

  // Dynamically extract emergency helpline phone number
  const emergencyPhone = (() => {
    const item = contactInfo.find((c) => {
      const l = (c?.label || "").toLowerCase();
      return (
        l.includes("phone") ||
        l.includes("mobile") ||
        l.includes("helpline") ||
        l.includes("emergency") ||
        l.includes("tel") ||
        l.includes("contact")
      );
    });
    if (!item) return "";
    if (Array.isArray(item.value)) return item.value[0] || "";
    return typeof item.value === "string" ? item.value.trim() : "";
  })();

  const bannerTitle = pageData?.title?.trim() || "Biomedical Support From Setup to Service";
  const bannerSubtitle = pageData?.description?.trim() || pageData?.subtitle?.trim() || "NABL-certified calibration, 2-hour emergency repair SLAs, cold-chain reagent distribution, and turnkey pathology setup.";

  return (
    <div className="bg-[#FAF5EE] text-[#38240D]">
      {/* Banner */}
      <PageBanner
        badge="Technical Services"
        title={bannerTitle}
        subtitle={bannerSubtitle}
      />

      {/* Services Grid Section */}
      <section className="section-padding bg-gradient-to-b from-white via-[#FAF5EE] to-[#F5ECE1]">
        <div className="container-custom">
          <SectionTitle
            badge="Full Service Catalog"
            title="Designed Around Reliable Operations"
            description="Explore our specialized services designed to keep clinical laboratories and hospital departments operating at peak accuracy."
            center
          />

          {services.length > 0 ? (
            <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {services.map((service, index) => (
                <ServiceCard
                  key={service.id || index}
                  icon={icons[index % icons.length]}
                  title={service.title}
                  description={service.desc || service.description}
                  badge={service.badge}
                  turnaround={service.turnaround}
                  highlights={service.highlights}
                  makeLink={makeLink}
                />
              ))}
            </div>
          ) : (
            <div className="mt-14 text-center py-12 rounded-3xl border border-[#E4D2C0] bg-white">
              <p className="text-[#6B5645] font-semibold">Loading technical engineering services...</p>
            </div>
          )}
        </div>
      </section>

      {/* Workflow Process Section */}
      <section className="section-padding bg-white border-y border-[#E4D2C0]">
        <div className="container-custom">
          <SectionTitle
            badge="Execution Framework"
            title="Our 4-Step Engineering Workflow"
            description="A systematic process ensuring seamless integration, rapid compliance, and long-term instrument reliability."
            center
          />

          <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {workflowSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={index}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-[#E4D2C0] bg-[#FAF5EE] p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-[#9E532B] hover:shadow-xl"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-4xl font-black text-[#9E532B]/40 group-hover:text-[#9E532B] transition-colors">
                        {step.step}
                      </span>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#9E532B] shadow-sm border border-[#E4D2C0]">
                        <Icon size={24} />
                      </div>
                    </div>

                    <h3 className="mt-6 text-xl font-bold text-[#38240D] group-hover:text-[#9E532B] transition-colors">
                      {step.title}
                    </h3>

                    <p className="mt-3 text-sm leading-relaxed text-[#6B5645]">
                      {step.desc}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#E4D2C0]/60">
                    <span className="text-xs font-bold text-[#9E532B]">Phase {index + 1} Milestone</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Breakdown SLA Box */}
      <section className="section-padding bg-gradient-to-b from-[#FAF5EE] via-white to-[#F5ECE1]">
        <div className="container-custom">
          <div className="rounded-3xl border border-[#E4D2C0] bg-gradient-to-r from-[#2C1809] to-[#38240D] p-8 sm:p-12 text-white shadow-xl">
            <div className="grid lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#9E532B] px-4 py-1.5 text-xs font-bold text-white uppercase tracking-wider">
                  <Zap size={14} /> Emergency Breakdown Helpline
                </span>

                <h3 className="mt-4 text-3xl font-black text-white sm:text-4xl">
                  Facing an Equipment Emergency in ICU or Lab?
                </h3>

                <p className="mt-3 text-base text-[#E4D2C0] leading-relaxed">
                  Our certified field engineers are equipped with OEM diagnostic kits and genuine spare parts for instant on-site restoration.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-6 text-sm font-semibold text-white">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-[#E4A87C]" />
                    <span>2-Hour On-Site SLA</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-[#E4A87C]" />
                    <span>Loaner Analyzer Option</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-[#E4A87C]" />
                    <span>NABL Re-calibration Included</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col items-center justify-center text-center border-t lg:border-t-0 lg:border-l border-[#E4D2C0]/20 pt-6 lg:pt-0 lg:pl-8">
                <p className="text-xs font-bold uppercase tracking-wider text-[#E4D2C0]">Emergency Dispatch</p>
                {emergencyPhone ? (
                  <a
                    href={`tel:${emergencyPhone.replace(/\s+/g, "")}`}
                    className="mt-2 text-2xl font-black text-white hover:text-[#E4A87C] transition-colors inline-block"
                  >
                    {emergencyPhone}
                  </a>
                ) : (
                  <p className="mt-2 text-sm text-[#E4D2C0]">24/7 Field Dispatch Active</p>
                )}
                <Link
                  href={makeLink("/contact")}
                  className="mt-5 w-full rounded-2xl bg-[#9E532B] py-3.5 text-center text-sm font-bold text-white shadow-lg transition-all hover:bg-[#7D3B17]"
                >
                  Book Priority Repair
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}