export const runtime = "nodejs";

import { auth } from "@clerk/nextjs/server";
import { type NextRequest } from "next/server";
import { getNoteById } from "@/lib/notes";
import {
  renderToBuffer,
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import { marked, type Token, type Tokens } from "marked";
import React from "react";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 11,
    paddingTop: 52,
    paddingBottom: 60,
    paddingHorizontal: 60,
    backgroundColor: "#ffffff",
    color: "#1a1a1a",
  },
  title: {
    fontFamily: "Helvetica-Bold",
    fontSize: 22,
    marginBottom: 24,
    color: "#111111",
  },
  h1: {
    fontFamily: "Helvetica-Bold",
    fontSize: 17,
    marginTop: 16,
    marginBottom: 6,
    color: "#111111",
  },
  h2: {
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
    marginTop: 14,
    marginBottom: 5,
    color: "#222222",
  },
  h3: {
    fontFamily: "Helvetica-BoldOblique",
    fontSize: 12,
    marginTop: 12,
    marginBottom: 4,
    color: "#333333",
  },
  paragraph: {
    fontSize: 11,
    lineHeight: 1.75,
    marginBottom: 8,
    color: "#1a1a1a",
  },
  bold: { fontFamily: "Helvetica-Bold" },
  italic: { fontFamily: "Helvetica-Oblique" },
  inlineCode: {
    fontFamily: "Courier",
    fontSize: 10,
    backgroundColor: "#f0f0f0",
  },
  codeBlock: {
    fontFamily: "Courier",
    fontSize: 9.5,
    lineHeight: 1.55,
    backgroundColor: "#f6f6f6",
    borderLeftWidth: 3,
    borderLeftColor: "#cccccc",
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 8,
  },
  image: {
    width: "100%",
    marginVertical: 10,
    objectFit: "contain",
  },
  listItem: {
    flexDirection: "row",
    marginBottom: 4,
  },
  listBullet: {
    width: 18,
    fontSize: 11,
    color: "#555555",
  },
  listItemText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 1.65,
    color: "#1a1a1a",
  },
  hr: {
    borderBottomWidth: 1,
    borderBottomColor: "#dddddd",
    marginVertical: 14,
  },
  blockView: {
    marginBottom: 2,
  },
});

function renderInline(token: Token, key: number): React.ReactNode {
  switch (token.type) {
    case "strong":
      return <Text key={key} style={styles.bold}>{(token as Tokens.Strong).text}</Text>;
    case "em":
      return <Text key={key} style={styles.italic}>{(token as Tokens.Em).text}</Text>;
    case "codespan":
      return <Text key={key} style={styles.inlineCode}>{(token as Tokens.Codespan).text}</Text>;
    case "br":
      return "\n";
    case "link":
      return <Text key={key}>{(token as Tokens.Link).text}</Text>;
    case "del":
      return <Text key={key}>{(token as Tokens.Del).text}</Text>;
    case "text":
      return (token as Tokens.Text).text;
    case "escape":
      return (token as Tokens.Escape).text;
    default:
      return "raw" in token ? (token as { raw: string }).raw : "";
  }
}

// Splits a paragraph's inline tokens into text runs and images,
// returning a mix of <Text> and <Image> children for a View.
function renderParagraphContent(tokens: Token[]): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  let textBuffer: React.ReactNode[] = [];

  const flushText = () => {
    if (textBuffer.length > 0) {
      result.push(
        <Text key={result.length} style={styles.paragraph}>
          {textBuffer}
        </Text>
      );
      textBuffer = [];
    }
  };

  for (const t of tokens) {
    if (t.type === "image") {
      flushText();
      const imgToken = t as Tokens.Image;
      result.push(
        <Image key={result.length} src={imgToken.href} style={styles.image} />
      );
    } else {
      textBuffer.push(renderInline(t, textBuffer.length));
    }
  }
  flushText();
  return result;
}

function renderToken(token: Token, index: number): React.ReactNode {
  switch (token.type) {
    case "heading": {
      const t = token as Tokens.Heading;
      const headingStyle =
        t.depth === 1 ? styles.h1 : t.depth === 2 ? styles.h2 : styles.h3;
      return (
        <Text key={index} style={headingStyle}>
          {t.text}
        </Text>
      );
    }

    case "paragraph": {
      const t = token as Tokens.Paragraph;
      const inlineTokens = t.tokens ?? [];
      return (
        <View key={index} style={styles.blockView}>
          {renderParagraphContent(inlineTokens)}
        </View>
      );
    }

    case "code": {
      const t = token as Tokens.Code;
      return (
        <Text key={index} style={styles.codeBlock}>
          {t.text}
        </Text>
      );
    }

    case "list": {
      const t = token as Tokens.List;
      return (
        <View key={index} style={styles.blockView}>
          {t.items.map((item, i) => (
            <View key={i} style={styles.listItem}>
              <Text style={styles.listBullet}>
                {t.ordered ? `${i + 1}.` : "•"}
              </Text>
              <Text style={styles.listItemText}>{item.text}</Text>
            </View>
          ))}
        </View>
      );
    }

    case "hr":
      return <View key={index} style={styles.hr} />;

    case "space":
      return null;

    default:
      return null;
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const note = await getNoteById(userId, id);
  if (!note) return new Response("Not found", { status: 404 });

  const tokens = marked.lexer(note.content);

  const pdf = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{note.title}</Text>
        {tokens.map((token, i) => renderToken(token, i))}
      </Page>
    </Document>
  );

  const buffer = await renderToBuffer(pdf);

  const filename = note.title
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}.pdf"`,
    },
  });
}
