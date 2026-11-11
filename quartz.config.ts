import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "RGBT 论文分享笔记",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    locale: "zh-CN",
    baseUrl: "donxy.github.io/rgbt-notes",
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "modified",
    theme: {
      // 系统字体栈（在 custom.scss 里定义），不依赖 Google Fonts
      fontOrigin: "local",
      cdnCaching: false,
      typography: {
        header: "Songti SC",
        body: "PingFang SC",
        code: "SF Mono",
      },
      colors: {
        lightMode: {
          light: "#f7f5f0",
          lightgray: "#e7e1d6",
          gray: "#b3a893",
          darkgray: "#453f36",
          dark: "#211d18",
          secondary: "#175e63",
          tertiary: "#c26d2d",
          highlight: "rgba(23, 94, 99, 0.12)",
          textHighlight: "#ffe58a88",
        },
        darkMode: {
          light: "#14161a",
          lightgray: "#2a2e35",
          gray: "#5f6773",
          darkgray: "#d6d2c9",
          dark: "#edeae3",
          secondary: "#7fb5ba",
          tertiary: "#e2a05a",
          highlight: "rgba(127, 181, 186, 0.14)",
          textHighlight: "#b3aa0288",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      // Comment out CustomOgImages to speed up build time
      // Plugin.CustomOgImages(),
    ],
  },
}

export default config
