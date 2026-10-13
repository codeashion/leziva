/**
 * LEZIVA — Content Management System (CMS) & Brand Publishing Service
 * 
 * Manages static editorial policy pages (About, Shipping, Returns, Privacy, Terms, FAQ)
 * and homepage luxury campaign hero banners with SEO metadata.
 */

import { prisma } from "@/server/db/prisma";
import { auditRepository } from "@/server/repositories/audit.repository";
import { CmsPageStatus } from "@prisma/client";

export interface CmsPageData {
  id: string;
  slug: string;
  title: string;
  content: string;
  status: CmsPageStatus;
  metaTitle?: string | null;
  metaDescription?: string | null;
  publishedAt?: string | null;
  updatedAt: string;
}

export interface HeroBannerData {
  id: string;
  title: string;
  subtitle?: string | null;
  ctaText?: string | null;
  ctaLink?: string | null;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
}

export class CmsService {
  private memoryPages: CmsPageData[] = [
    {
      id: "cms_page_about",
      slug: "about",
      title: "The Atelier Story",
      content: "LEZIVA is an Indian luxury haute couture house celebrating timeless artisanal handlooms.",
      status: CmsPageStatus.PUBLISHED,
      metaTitle: "About LEZIVA | Heritage Luxury Fashion",
      metaDescription: "Discover the heritage, artistry, and handcraft behind LEZIVA luxury ensembles.",
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "cms_page_shipping",
      slug: "shipping-policy",
      title: "Shipping & Atelier Delivery",
      content: "All orders are packaged in bespoke protective keepsake trunks and dispatched from our Surat atelier.",
      status: CmsPageStatus.PUBLISHED,
      metaTitle: "Shipping & Delivery Policy | LEZIVA",
      metaDescription: "Domestic and international luxury transit timelines, courier tracking, and atelier delivery guarantees.",
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "cms_page_returns",
      slug: "returns-policy",
      title: "Returns & Exchange Concierge",
      content: "Unworn atelier garments in pristine condition may be requested for exchange within 7 days of delivery.",
      status: CmsPageStatus.PUBLISHED,
      metaTitle: "Returns & Exchanges | LEZIVA",
      metaDescription: "Information regarding complimentary return pickup and bespoke garment exchange policies.",
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  private memoryBanners: HeroBannerData[] = [
    {
      id: "banner_festive_2026",
      title: "Royal Festive 2026 Haute Couture",
      subtitle: "Hand-loomed Banarasi Silk Ensembles & Zardozi Embellishments",
      ctaText: "Explore Collection",
      ctaLink: "/shop?collection=festive",
      imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1920&q=85",
      sortOrder: 1,
      isActive: true,
      updatedAt: new Date().toISOString(),
    },
  ];

  /**
   * Retrieves all CMS pages.
   */
  async getPages(): Promise<CmsPageData[]> {
    try {
      const dbPages = await prisma.cmsPage.findMany({
        orderBy: { updatedAt: "desc" },
      });
      if (dbPages.length > 0) {
        return dbPages.map((p) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          content: p.content,
          status: p.status,
          metaTitle: p.metaTitle,
          metaDescription: p.metaDescription,
          publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
          updatedAt: p.updatedAt.toISOString(),
        }));
      }
    } catch {
      // Memory fallback
    }
    return this.memoryPages;
  }

  /**
   * Retrieves a CMS page by slug.
   */
  async getPageBySlug(slug: string): Promise<CmsPageData | null> {
    const pages = await this.getPages();
    return pages.find((p) => p.slug === slug) || null;
  }

  /**
   * Creates or updates a CMS page.
   */
  async upsertPage(
    data: {
      slug: string;
      title: string;
      content: string;
      status?: CmsPageStatus;
      metaTitle?: string;
      metaDescription?: string;
    },
    actorId?: string
  ): Promise<CmsPageData> {
    const status = data.status || CmsPageStatus.DRAFT;
    const publishedAt = status === CmsPageStatus.PUBLISHED ? new Date().toISOString() : null;

    const pageItem: CmsPageData = {
      id: `cms_${data.slug}_${Date.now().toString(36)}`,
      slug: data.slug,
      title: data.title,
      content: data.content,
      status,
      metaTitle: data.metaTitle || data.title,
      metaDescription: data.metaDescription,
      publishedAt,
      updatedAt: new Date().toISOString(),
    };

    try {
      await prisma.cmsPage.upsert({
        where: { slug: data.slug },
        update: {
          title: data.title,
          content: data.content,
          status,
          metaTitle: data.metaTitle,
          metaDescription: data.metaDescription,
          publishedAt: status === CmsPageStatus.PUBLISHED ? new Date() : undefined,
        },
        create: {
          slug: data.slug,
          title: data.title,
          content: data.content,
          status,
          metaTitle: data.metaTitle,
          metaDescription: data.metaDescription,
          publishedAt: status === CmsPageStatus.PUBLISHED ? new Date() : undefined,
          authorId: actorId || null,
        },
      });
    } catch {
      // Memory fallback
      const idx = this.memoryPages.findIndex((p) => p.slug === data.slug);
      if (idx >= 0) {
        this.memoryPages[idx] = pageItem;
      } else {
        this.memoryPages.push(pageItem);
      }
    }

    await auditRepository.recordLog({
      actorId: actorId || null,
      action: "CMS_PAGE_SAVED",
      resourceType: "CMS",
      resourceId: data.slug,
      metadata: { title: data.title, status },
    });

    return pageItem;
  }

  /**
   * Retrieves all Hero Banners.
   */
  async getBanners(): Promise<HeroBannerData[]> {
    try {
      const dbBanners = await prisma.heroBanner.findMany({
        orderBy: { sortOrder: "asc" },
      });
      if (dbBanners.length > 0) {
        return dbBanners.map((b) => ({
          id: b.id,
          title: b.title,
          subtitle: b.subtitle,
          ctaText: b.ctaText,
          ctaLink: b.ctaLink,
          imageUrl: b.imageUrl,
          sortOrder: b.sortOrder,
          isActive: b.isActive,
          updatedAt: b.updatedAt.toISOString(),
        }));
      }
    } catch {
      // Memory fallback
    }
    return this.memoryBanners;
  }

  /**
   * Saves or updates a Hero Banner.
   */
  async saveBanner(
    data: {
      id?: string;
      title: string;
      subtitle?: string;
      ctaText?: string;
      ctaLink?: string;
      imageUrl: string;
      sortOrder?: number;
      isActive?: boolean;
    },
    actorId?: string
  ): Promise<HeroBannerData> {
    const bannerId = data.id || `banner_${Date.now().toString(36)}`;
    const bannerItem: HeroBannerData = {
      id: bannerId,
      title: data.title,
      subtitle: data.subtitle,
      ctaText: data.ctaText,
      ctaLink: data.ctaLink,
      imageUrl: data.imageUrl,
      sortOrder: data.sortOrder ?? 1,
      isActive: data.isActive ?? true,
      updatedAt: new Date().toISOString(),
    };

    try {
      if (data.id) {
        await prisma.heroBanner.update({
          where: { id: data.id },
          data: {
            title: data.title,
            subtitle: data.subtitle,
            ctaText: data.ctaText,
            ctaLink: data.ctaLink,
            imageUrl: data.imageUrl,
            sortOrder: bannerItem.sortOrder,
            isActive: bannerItem.isActive,
          },
        });
      } else {
        await prisma.heroBanner.create({
          data: {
            id: bannerId,
            title: data.title,
            subtitle: data.subtitle,
            ctaText: data.ctaText,
            ctaLink: data.ctaLink,
            imageUrl: data.imageUrl,
            sortOrder: bannerItem.sortOrder,
            isActive: bannerItem.isActive,
          },
        });
      }
    } catch {
      const idx = this.memoryBanners.findIndex((b) => b.id === bannerId);
      if (idx >= 0) {
        this.memoryBanners[idx] = bannerItem;
      } else {
        this.memoryBanners.push(bannerItem);
      }
    }

    await auditRepository.recordLog({
      actorId: actorId || null,
      action: "HERO_BANNER_SAVED",
      resourceType: "CMS",
      resourceId: bannerId,
      metadata: { title: data.title },
    });

    return bannerItem;
  }
}

export const cmsService = new CmsService();
