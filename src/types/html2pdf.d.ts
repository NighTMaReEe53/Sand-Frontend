declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number | [number, number, number, number];
    filename?: string;
    image?: { type?: string; quality?: number };
    enableLinks?: boolean;
    html2canvas?: {
      scale?: number;
      useCORS?: boolean;
      letterRendering?: boolean;
      backgroundColor?: string | null;
      scrollX?: number;
      scrollY?: number;
      windowWidth?: number;
    };
    jsPDF?: {
      unit?: string;
      format?: string | [number, number];
      orientation?: 'portrait' | 'landscape';
      compressPDF?: boolean;
    };
    pagebreak?: {
      mode?: string | string[];
      before?: string | string[];
      after?: string | string[];
      avoid?: string | string[];
    };
  }

  interface Html2PdfWorker {
    from(element: HTMLElement | string): Html2PdfWorker;
    set(options: Html2PdfOptions): Html2PdfWorker;
    save(filename?: string): Promise<void>;
    outputPdf(type?: string, params?: any): Promise<any>;
    output(type?: string, params?: any): Promise<any>;
  }

  function html2pdf(): Html2PdfWorker;
  function html2pdf(element: HTMLElement | string, options?: Html2PdfOptions): Html2PdfWorker;

  export default html2pdf;
}
