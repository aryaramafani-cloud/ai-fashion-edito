import React, { useState } from 'react';
import { Loader2, Image as ImageIcon, Sparkles, RefreshCw, Smartphone, Square, Monitor, Maximize, Download, Palette } from 'lucide-react';

const aspectRatios = [
  { value: '9:16', label: 'TikTok / Reels', icon: Smartphone, ratioStyle: '9 / 16', width: 1080, height: 1920 },
  { value: '1:1', label: 'Square (IG Feed)', icon: Square, ratioStyle: '1 / 1', width: 1080, height: 1080 },
  { value: '4:5', label: 'Portrait', icon: Maximize, ratioStyle: '4 / 5', width: 1080, height: 1350 },
  { value: '16:9', label: 'Landscape', icon: Monitor, ratioStyle: '16 / 9', width: 1920, height: 1080 },
];

const prompts = [
  {
    id: 'saha_style',
    label: 'Gaya Realistis (SAHA)',
    description: 'Karpet abu, laptop, tanaman, cermin pantulan',
    getPromptText: (ratioValue, ratioWidth, ratioHeight) => `
      Ubah latar belakang gambar ini menjadi lantai karpet abu-abu yang elegan. 
      Letakkan kaos hitam ini di atas lantai dalam tata letak flat lay. 
      SANGAT PENTING: Pertahankan desain gambar grafis asli pada kaos persis 100% seperti gambar yang diunggah. JANGAN menambahkan tulisan, teks, atau logo baru apapun pada kaos.
      Tambahkan pantulan cahaya jendela yang realistis di atas lantai karpet. 
      Di sekitar pakaian, tambahkan: satu tanaman hias hijau dalam pot, sebuah laptop modern, sebuah topi, dan sepasang sepatu kasual.
      Berikan cermin di sampingnya yang memantulkan pemandangan tersebut. 
      Gaya: Fotografi realistis, Ultra HD, resolusi tinggi, pencahayaan sinematik.
      Rasio aspek ${ratioValue} (${ratioWidth}x${ratioHeight} piksel).
    `
  },
  {
    id: 'dikshop_style',
    label: 'Gaya Minimalis (DikShop21)',
    description: 'Karpet bulu terang, lantai kayu gelap, buku, sinar jendela',
    getPromptText: (ratioValue, ratioWidth, ratioHeight) => `
      Letakkan t-shirt ini di atas karpet berbulu warna abu-abu terang. 
      SANGAT PENTING: Pertahankan gambar grafis asli pada kaos secara akurat. JANGAN menambahkan tulisan atau logo baru apapun.
      Alas utama lantai kayu abu-abu gelap dengan motif garis kayu yang jelas.
      Efek sinar matahari masuk dari jendela 6 kotak menyinari baju dan karpet.
      Pencahayaan bersih, aesthetic, minimalis. Tambahkan sebuah buku di sekitarnya.
      Gaya: Fotografi produk profesional, aesthetic minimalis, resolusi 4K.
      Rasio aspek ${ratioValue} (${ratioWidth}x${ratioHeight} piksel).
    `
  },
  {
    id: 'piishoop_style',
    label: 'Gaya Piishoop 🛒🛍️',
    description: 'Lantai karpet abu, cermin, properti lengkap (Oleh Dendi)',
    getPromptText: (ratioValue, ratioWidth, ratioHeight) => `
      Ganti background dengan lantai karpet abu, letakkan kaos ini di lantai. 
      SANGAT PENTING: Pertahankan setiap detail gambar grafis asli pada baju ini, jangan ubah desainnya.
      Tambah pantulan cahaya dari jendela. Tambahkan satu tanaman hias, laptop, topi, dan sepatu di sekitarnya. 
      Beri cermin di sampingnya dan gambar baju terpantul di cermin. 
      Buat serealistis mungkin. Watermark "Diciptakan oleh Dendi" di sudut gambar.
      Gaya: Fotografi realistis, resolusi ultra HD.
      Rasio aspek ${ratioValue} (${ratioWidth}x${ratioHeight} piksel).
    `
  }
];

const App = () => {
  const [originalImage, setOriginalImage] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRatio, setSelectedRatio] = useState(aspectRatios[0]);
  const [selectedPrompt, setSelectedPrompt] = useState(prompts[2]);

  const apiKey = "AIzaSyDKTemR-SHpmpygN9VHSER8Ufi-lE3koV0";

  const generateImage = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      if (!originalImage) throw new Error("Silakan unggah gambar baju terlebih dahulu.");

      const promptText = selectedPrompt.getPromptText(selectedRatio.value, selectedRatio.width, selectedRatio.height);
      const base64Data = originalImage.split(',')[1];

      // Coba model satu per satu
      const models = [
        'gemini-2.0-flash-exp',
        'gemini-1.5-flash',
        'gemini-1.5-pro'
      ];

      let generatedBase64 = null;

      for (const model of models) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{
                  role: "user",
                  parts: [
                    { text: promptText },
                    { inlineData: { mimeType: "image/jpeg", data: base64Data } }
                  ]
                }],
                generationConfig: {
                  responseModalities: ["TEXT", "IMAGE"]
                }
              })
            }
          );

          const result = await response.json();

          if (response.ok) {
            generatedBase64 = result.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
            if (generatedBase64) break;
          }
        } catch (e) {
          continue;
        }
      }

      if (generatedBase64) {
        setGeneratedImage(`data:image/png;base64,${generatedBase64}`);
      } else {
        throw new Error("Model tidak mendukung generate gambar. Coba lagi nanti.");
      }

    } catch (err) {
      console.error(err);
      setError(`Error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setOriginalImage(reader.result); setGeneratedImage(null); };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `baju-${selectedPrompt.id}-${selectedRatio.value.replace(':', 'x')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-8 font-sans flex flex-col">
      <div className="max-w-6xl mx-auto flex-grow w-full">
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            AI Fashion Editor Pro
          </h1>
          <p className="text-neutral-400 mt-2">Pilih gaya dan ukuran untuk foto produk Anda</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800">
          <div>
            <h3 className="text-sm font-semibold text-neutral-400 mb-3 uppercase tracking-wider flex items-center gap-2">
              <Monitor className="w-4 h-4" /> 1. Pilih Ukuran
            </h3>
            <div className="flex flex-wrap gap-3">
              {aspectRatios.map((ratio) => {
                const Icon = ratio.icon;
                const isActive = selectedRatio.value === ratio.value;
                return (
                  <button key={ratio.value} onClick={() => setSelectedRatio(ratio)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex-1 min-w-[140px] ${isActive ? 'bg-blue-600 text-white border border-blue-500' : 'bg-neutral-800 text-neutral-400 border border-neutral-700 hover:bg-neutral-700 hover:text-white'}`}>
                    <Icon className="w-4 h-4" />
                    <div className="flex flex-col items-start text-left">
                      <span>{ratio.label}</span>
                      <span className="opacity-60 text-[10px]">{ratio.value} ({ratio.width}x{ratio.height})</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-neutral-400 mb-3 uppercase tracking-wider flex items-center gap-2">
              <Palette className="w-4 h-4" /> 2. Pilih Gaya Foto
            </h3>
            <div className="flex flex-col gap-3">
              {prompts.map((promptOpt) => {
                const isActive = selectedPrompt.id === promptOpt.id;
                return (
                  <button key={promptOpt.id} onClick={() => setSelectedPrompt(promptOpt)}
                    className={`flex flex-col items-start px-5 py-3 rounded-xl transition-all duration-200 text-left w-full ${isActive ? 'bg-purple-600/20 border-2 border-purple-500' : 'bg-neutral-800 border-2 border-neutral-700 hover:border-neutral-600'}`}>
                    <span className={`font-bold ${isActive ? 'text-purple-300' : 'text-neutral-200'}`}>{promptOpt.label}</span>
                    <span className={`text-xs mt-1 ${isActive ? 'text-purple-200/70' : 'text-neutral-500'}`}>{promptOpt.description}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-neutral-900 rounded-2xl p-6 border border-neutral-800 flex flex-col">
            <h2 className="text-lg font-medium mb-4 flex items-center justify-center gap-2">
              <ImageIcon className="w-5 h-5" /> Sumber Gambar
            </h2>
            <div className="flex-grow flex items-center justify-center bg-neutral-800 rounded-xl border-2 border-dashed border-neutral-700 min-h-[300px] overflow-hidden">
              {originalImage ? (
                <img src={originalImage} alt="Original" className="max-w-full max-h-full object-contain p-2" />
              ) : (
                <div className="text-center p-4">
                  <p className="text-neutral-500 text-sm mb-4">Belum ada gambar yang dipilih</p>
                  <label className="cursor-pointer bg-neutral-700 hover:bg-neutral-600 px-4 py-2 rounded-lg transition-colors inline-block font-medium">
                    Pilih File Baju
                    <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
                  </label>
                </div>
              )}
            </div>
            {originalImage && (
              <div className="text-center mt-4">
                <label className="cursor-pointer text-sm text-blue-400 hover:text-blue-300 underline font-medium">
                  Ganti Gambar
                  <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
                </label>
              </div>
            )}
          </div>

          <div className="bg-neutral-900 rounded-2xl p-6 border border-neutral-800 flex flex-col">
            <h2 className="text-lg font-medium mb-4 flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" /> Hasil Edit
            </h2>
            <div className="flex flex-col items-center flex-grow">
              <div className="w-full bg-neutral-800 rounded-xl overflow-hidden flex items-center justify-center border border-neutral-700 min-h-[300px]"
                style={{ aspectRatio: selectedRatio.ratioStyle, maxHeight: '60vh' }}>
                {isGenerating ? (
                  <div className="flex flex-col items-center gap-4 p-6 text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                    <p className="text-neutral-400 animate-pulse text-sm">Menerapkan {selectedPrompt.label}...</p>
                  </div>
                ) : generatedImage ? (
                  <img src={generatedImage} alt="Generated" className="w-full h-full object-cover" />
                ) : (
                  <p className="text-neutral-500 text-sm text-center p-6">Klik 'Proses Sekarang' untuk melihat hasil</p>
                )}
              </div>
              {generatedImage && !isGenerating && (
                <button onClick={handleDownload}
                  className="mt-6 flex items-center justify-center gap-2 w-full max-w-xs bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95">
                  <Download className="w-5 h-5" /> Download Gambar
                </button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-4 rounded-xl mb-6 text-sm text-center">{error}</div>
        )}

        <div className="flex justify-center pb-4 mt-4">
          <button onClick={generateImage} disabled={!originalImage || isGenerating}
            className={`flex items-center gap-3 px-10 py-4 rounded-full font-bold text-lg transition-all ${!originalImage || isGenerating ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-105 active:scale-95 text-white shadow-lg'}`}>
            {isGenerating ? (<><RefreshCw className="w-6 h-6 animate-spin" /> Membuat Gambar...</>) : (<><Sparkles className="w-6 h-6" /> Proses Sekarang</>)}
          </button>
        </div>

        <footer className="mt-8 mb-4 text-center text-neutral-500 text-sm">
          <p className="font-semibold text-neutral-400">© Diciptakan oleh Dendi</p>
          <p className="text-xs mt-1 opacity-70">Ditenagai oleh Google Gemini AI untuk hasil HD</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
