"use client";

import { useState, useEffect } from "react";
import { useTransactions, type Portfolio, type PortfolioStrategy } from "@/context/TransactionContext";
import { cn } from "@/lib/utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialPortfolio?: Portfolio | null;
}

const STRATEGY_OPTIONS: {
  value: PortfolioStrategy;
  label: string;
  desc: string;
  icon: string;
}[] = [
  {
    value: "GROWTH",
    label: "Growth (เติบโต)",
    desc: "เน้นการเติบโตของมูลค่าสินทรัพย์และ Capital Gain ระยะยาว",
    icon: "🚀",
  },
  {
    value: "DIVIDEND",
    label: "Dividend (ปันผล)",
    desc: "เน้นหุ้นปันผลสม่ำเสมอ กระแสเงินสด และ Passive Income",
    icon: "💰",
  },
  {
    value: "TRADING",
    label: "Trading (เก็งกำไร)",
    desc: "เน้นกลยุทธ์การเทรดระยะสั้น รอบสวิงเทรด และโมเมนตัม",
    icon: "⚡",
  },
  {
    value: "CUSTOM",
    label: "Custom (กำหนดเอง)",
    desc: "จัดพอร์ตตามธีมเฉพาะตัว เช่น พอร์ต DCA, กองทุนรวม หรือ Tech",
    icon: "🎯",
  },
];

const COLOR_PRESETS = [
  "#10b981", // Emerald
  "#3b82f6", // Blue
  "#8b5cf6", // Purple
  "#f59e0b", // Amber
  "#f43f5e", // Rose
  "#06b6d4", // Cyan
  "#ec4899", // Pink
  "#64748b", // Slate
];

export default function PortfolioModal({ isOpen, onClose, initialPortfolio }: Props) {
  const { addPortfolio, editPortfolio, deletePortfolio, activePortfolioId, setActivePortfolioId } =
    useTransactions();

  const [name, setName] = useState("");
  const [strategy, setStrategy] = useState<PortfolioStrategy>("GROWTH");
  const [color, setColor] = useState("#10b981");
  const [description, setDescription] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isEditing = Boolean(initialPortfolio);

  useEffect(() => {
    if (initialPortfolio) {
      setName(initialPortfolio.name);
      setStrategy(initialPortfolio.strategy);
      setColor(initialPortfolio.color || "#10b981");
      setDescription(initialPortfolio.description || "");
    } else {
      setName("");
      setStrategy("GROWTH");
      setColor("#10b981");
      setDescription("");
    }
    setShowDeleteConfirm(false);
  }, [initialPortfolio, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isEditing && initialPortfolio) {
      await editPortfolio(initialPortfolio.id, {
        name: name.trim(),
        strategy,
        color,
        description: description.trim(),
      });
    } else {
      const created = await addPortfolio({
        name: name.trim(),
        strategy,
        color,
        description: description.trim(),
      });
      // Switch to newly created portfolio
      if (created) setActivePortfolioId(created.id);
    }

    onClose();
  };

  const handleDelete = async () => {
    if (initialPortfolio) {
      await deletePortfolio(initialPortfolio.id);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="glass-card w-full max-w-md p-6 sm:p-7 animate-fade-in-up shadow-2xl relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div
          className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-24 rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ backgroundColor: color }}
        />

        {/* Header */}
        <div className="flex items-center justify-between mb-5 relative z-10">
          <div className="flex items-center gap-2.5">
            <div
              style={{ backgroundColor: `${color}20`, borderColor: `${color}40`, color }}
              className="w-9 h-9 rounded-xl border flex items-center justify-center font-bold text-base shadow-sm"
            >
              {STRATEGY_OPTIONS.find((s) => s.value === strategy)?.icon || "💼"}
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {isEditing ? "Edit Portfolio" : "Create New Portfolio"}
              </h2>
              <p className="text-xs text-muted">
                {isEditing ? "ปรับแต่งข้อมูลและกลยุทธ์ของพอร์ตนี้" : "แยกพอร์ตตามสไตล์และเป้าหมายการลงทุน"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted hover:text-foreground hover:bg-muted-bg transition-all cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Delete Confirmation Alert */}
        {showDeleteConfirm ? (
          <div className="p-4 rounded-2xl bg-loss/10 border border-loss/20 space-y-3 mb-4 animate-fade-in-up">
            <p className="text-xs font-bold text-loss">
              ⚠️ ต้องการลบพอร์ต "{initialPortfolio?.name}" ใช่หรือไม่?
            </p>
            <p className="text-[11px] text-muted leading-relaxed">
              รายการธุรกรรมในพอร์ตนี้จะถูกย้ายไปยังพอร์ตเริ่มต้น (Growth) โดยอัตโนมัติ ไม่ทำให้ประวัติการเทรดสูญหาย
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleDelete}
                className="px-3.5 py-1.5 rounded-xl bg-loss text-white text-xs font-bold shadow-md hover:bg-loss/90 transition-all cursor-pointer"
              >
                ยืนยันการลบ
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3.5 py-1.5 rounded-xl bg-muted-bg text-muted hover:text-foreground text-xs font-semibold transition-all cursor-pointer"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {/* Portfolio Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
              Portfolio Name (ชื่อพอร์ต) <span className="text-accent">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Growth Portfolio, High Dividend, Tech DCA"
              required
              className="w-full px-4 py-2.5 rounded-xl bg-input-bg border border-input-border text-foreground text-sm placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
            />
          </div>

          {/* Strategy Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
              Strategy (กลยุทธ์การลงทุน)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {STRATEGY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStrategy(opt.value)}
                  className={cn(
                    "p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between",
                    strategy === opt.value
                      ? "bg-accent/15 border-accent/40 shadow-xs"
                      : "bg-muted-bg/30 border-border/40 hover:border-border hover:bg-muted-bg/60"
                  )}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm">{opt.icon}</span>
                    <span className={cn(
                      "text-xs font-bold",
                      strategy === opt.value ? "text-accent" : "text-foreground"
                    )}>
                      {opt.label.split(" ")[0]}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted line-clamp-2 leading-tight">
                    {opt.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Color Badge Picker */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
              Theme Color (สีประจำพอร์ต)
            </label>
            <div className="flex items-center gap-2.5">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={cn(
                    "w-7 h-7 rounded-full transition-all cursor-pointer relative shadow-sm",
                    color === c
                      ? "ring-2 ring-offset-2 ring-white scale-110"
                      : "opacity-75 hover:opacity-100 hover:scale-105"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
              Description (คำอธิบายเพิ่มเติม - ไม่บังคับ)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="เช่น พอร์ตหลักสะสมหุ้นเทคสหรัฐ หรือ หุ้นปันผลไทย"
              className="w-full px-4 py-2 rounded-xl bg-input-bg border border-input-border text-foreground text-xs placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/40">
            {isEditing && !initialPortfolio?.isDefault ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-loss hover:bg-loss/10 transition-colors cursor-pointer"
              >
                Delete Portfolio
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-muted hover:text-foreground bg-muted-bg hover:bg-muted-bg/80 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ backgroundColor: color }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              >
                {isEditing ? "Save Changes" : "Create Portfolio"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
