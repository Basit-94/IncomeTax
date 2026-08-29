"use client";

import { CheckCircle2, AlertTriangle, ChevronRight } from "lucide-react";
import type { Persona, Lang, BankAccount, Notice } from "../../lib/types";
import { localize } from "../mock-i18n";
import { MockField, MockFill, MOCK } from "@/components/dev/mock-fill";

interface ActionsTabProps {
  persona: Persona;
  lang: Lang;
  rentLandlordName: string;
  rentLandlordPan: string;
  rentFile: string | null;
  setRentLandlordName: (v: string) => void;
  setRentLandlordPan: (v: string) => void;
  handleUploadRent: (e: React.ChangeEvent<HTMLInputElement>) => void;
  saveRentClaim: () => void;
  handleFixBank: (bank: BankAccount) => void;
  handleNoticeClick: (notice: Notice) => void;
}

export default function ActionsTab({
  persona,
  lang,
  rentLandlordName,
  rentLandlordPan,
  rentFile,
  setRentLandlordName,
  setRentLandlordPan,
  handleUploadRent,
  saveRentClaim,
  handleFixBank,
  handleNoticeClick,
}: ActionsTabProps) {
  return (
    <div className="space-y-6">
      
      {/* PENDING NOTICES */}
      {persona.notices.length > 0 ? (
        <div className="bg-white border border-line rounded-xl p-5 space-y-4 shadow-sm">
          <h3 className="text-xs font-mono uppercase tracking-wider text-ink-2 border-b border-line pb-2 font-bold">
            {localize("Outstanding Compliance Notices", lang)}
          </h3>

          <div className="space-y-4">
            {persona.notices.map((notice) => (
              <div 
                key={notice.id} 
                className={`p-4 border rounded-xl space-y-3 text-left ${
                  notice.status === "responded" 
                    ? "border-line bg-slate-50" 
                    : "border-alarm bg-alarm-soft/10"
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[0.65rem] font-mono bg-white border border-line text-ink-2 px-2 py-0.5 rounded">
                    {localize("DIN Validated • CBDT Circular 19/2019", lang)}
                  </span>
                  <span className={`text-[0.65rem] font-mono font-semibold px-2 py-0.5 rounded uppercase ${
                    notice.status === "responded" ? "bg-money-soft text-money" : "bg-alarm-soft text-alarm"
                  }`}>
                    {notice.status}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-ink leading-tight">
                    {localize(notice.headline, lang)}
                  </h4>
                  <span className="block text-[0.65rem] text-ink-3 font-mono">
                    DIN: {notice.din}
                  </span>
                </div>

                <p className="text-[0.7rem] text-ink-2 leading-relaxed">
                  {localize(notice.consequence, lang)}
                </p>

                {notice.status === "open" && (
                  <button
                    onClick={() => handleNoticeClick(notice)}
                    className="text-xs bg-alarm text-paper py-1.5 px-3 rounded font-semibold hover:bg-alarm-deep transition-colors"
                  >
                    {localize("Draft Legal Response", lang)}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-line rounded-xl p-10 text-center space-y-3">
          <CheckCircle2 size={36} className="text-money mx-auto" />
          <h3 className="font-bold text-ink text-sm">{localize("No Pending Actions", lang)}</h3>
          <p className="text-xs text-ink-2">{localize("Your account is fully compliant with no outstanding notices or tax demands.", lang)}</p>
        </div>
      )}

      {/* ACTIVE HOLDS LIST */}
      {persona.refund.state !== "not_filed" && persona.refund.holds.filter(h => !h.resolved).length > 0 && (
        <div className="bg-warn-soft/40 border border-warn/30 rounded-xl p-5 space-y-4 text-left shadow-sm">
          <h4 className="text-xs font-mono uppercase tracking-wider text-warn font-bold flex items-center gap-1.5 border-b border-warn/25 pb-2">
            <AlertTriangle size={14} />
            <span>{localize("Actionable Assessment Holds", lang)} ({persona.refund.holds.filter(h => !h.resolved).length})</span>
          </h4>

          <div className="space-y-4">
            {persona.refund.holds.filter(h => !h.resolved).map((hold) => (
              <div key={hold.id} className="space-y-2">
                <span className="block text-xs font-bold text-ink">
                  {localize(hold.headline, lang)}
                </span>
                <p className="text-xs text-ink-2 leading-relaxed">
                  {localize(hold.detail, lang)}
                </p>

                {/* Rent verification receipt upload form */}
                {hold.kind === "nudge_deduction" && (
                  <div className="bg-white border border-line rounded-lg p-3 space-y-3 mt-2">
                    <span className="block text-xs font-mono text-ink-2">{localize("Upload Rent Agreement / Receipts", lang)}</span>
                    
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <MockField>
                          <input 
                          type="text" 
                          placeholder={localize("Landlord Name", lang)} 
                          value={rentLandlordName}
                          onChange={(e) => setRentLandlordName(e.target.value)}
                          className="flex-1 text-xs border border-line p-2 rounded focus:outline-none focus:border-money"
                        />
                          <MockFill onFill={() => setRentLandlordName(MOCK.landlordName)} />
                        </MockField>
                        <MockField>
                          <input 
                          type="text" 
                          placeholder={localize("Landlord PAN (10 Digits)", lang)} 
                          value={rentLandlordPan}
                          onChange={(e) => setRentLandlordPan(e.target.value.toUpperCase())}
                          className="flex-1 text-xs border border-line p-2 rounded focus:outline-none focus:border-money font-mono uppercase"
                        />
                          <MockFill onFill={() => setRentLandlordPan(MOCK.landlordPan)} />
                        </MockField>
                      </div>
                      
                      <div className="flex items-center justify-between gap-2">
                        <input 
                          type="file" 
                          id="rent-receipt-upload" 
                          className="hidden" 
                          onChange={handleUploadRent}
                        />
                        <label 
                          htmlFor="rent-receipt-upload"
                          className="bg-paper border border-line text-xs font-semibold py-1.5 px-3 rounded hover:bg-paper-2 cursor-pointer text-ink-2"
                        >
                          {rentFile ? (lang === "hi" ? `चयनित: ${rentFile.substring(0, 12)}...` : lang === "ta" ? `தேர்வு செய்யப்பட்டது: ${rentFile.substring(0, 12)}...` : `Selected: ${rentFile.substring(0, 12)}...`) : localize("Select PDF/JPG", lang)}
                        </label>

                        <button
                          onClick={saveRentClaim}
                          disabled={!rentFile}
                          className="bg-navy text-paper text-xs font-semibold py-1.5 px-4 rounded hover:opacity-90 transition-colors disabled:opacity-50"
                        >
                          {localize("Submit Receipt", lang)}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stale Bank IFSC resolution button */}
                {hold.kind === "bank_invalid" && (
                  <button
                    onClick={() => handleFixBank(persona.banks[0])}
                    className="text-xs text-money font-semibold hover:underline flex items-center space-x-1"
                  >
                    <span>{localize(hold.action.label, lang)}</span>
                    <ChevronRight size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
