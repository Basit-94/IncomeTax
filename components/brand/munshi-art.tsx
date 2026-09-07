import type { ReactNode } from "react";

export type MunshiState = "idle" | "welcome" | "listening" | "explaining" | "working" | "reading" | "uploading" | "happy" | "concerned" | "success" | "error" | "waiting" | "secure";
export interface MunshiArtProps { id: string; size?: number; state?: MunshiState; className?: string; title?: string; animated?: boolean; compact?: boolean; children?: ReactNode; }

/** Editable paths reconstructed from the supplied identity master. Named groups are the rig. */
export function MunshiArt({ id, size = 120, state = "idle", className = "", title, animated = true, compact = false, children }: MunshiArtProps) {
  const paint = (name: string) => `url(#${id}-${name})`;
  const reading = state === "working" || state === "reading" || state === "uploading";
  const concerned = state === "concerned" || state === "error";
  const happy = state === "happy" || state === "success";
  const wave = state === "welcome" || state === "explaining";
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox={compact ? "48 22 172 182" : "0 0 256 256"} className={`munshi-svg ${className}`} data-state={state} data-animated={animated} data-compact={compact} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true} focusable="false">
      {title && <title>{title}</title>}{children}
      <defs>
        <linearGradient id={`${id}-skin`} x1="0" y1="0" x2=".85" y2="1"><stop stopColor="#F3B181"/><stop offset=".55" stopColor="#ECA174"/><stop offset="1" stopColor="#F4BE92"/></linearGradient>
        <linearGradient id={`${id}-face`} x2="0" y2="1"><stop stopColor="#EDAA7D"/><stop offset="1" stopColor="#F3B386"/></linearGradient>
        <linearGradient id={`${id}-shirt`} x2=".7" y2="1"><stop stopColor="#FFF0D9"/><stop offset=".55" stopColor="#FFE4C6"/><stop offset="1" stopColor="#F3CBA7"/></linearGradient>
        <linearGradient id={`${id}-hair`} x2=".8" y2="1"><stop stopColor="#382008"/><stop offset=".65" stopColor="#603510"/><stop offset="1" stopColor="#492609"/></linearGradient>
        <linearGradient id={`${id}-cheek`} x2="1" y2="1"><stop stopColor="#E88959" stopOpacity=".85"/><stop offset="1" stopColor="#E98555" stopOpacity=".25"/></linearGradient>
        <clipPath id={`${id}-eye-left`}><path d="M89 108 Q96 88 109 94 Q121 97 122 111 Q105 120 89 108Z"/></clipPath>
        <clipPath id={`${id}-eye-right`}><path d="M151 114 Q154 94 166 99 Q179 101 181 118 Q165 123 151 114Z"/></clipPath>
      </defs>
      <g className="mj-body" data-part="body">
        <path d="M205 166 Q232 186 224 216 Q219 230 202 228 L192 184Z" fill={paint("skin")}/>
        <g data-part="ears" fill={paint("skin")}><path d="M77 103 C62 88 55 103 62 119 Q68 127 77 126Z"/><path d="M208 114 C224 105 232 115 225 129 Q219 139 209 134Z"/></g>
        <g fill="#D77D50" opacity=".65"><path d="M72 105 Q60 99 66 117 Q64 105 72 114Z"/><path d="M215 118 Q229 112 220 130 Q225 119 215 125Z"/></g>
        <path d="M80 71 Q90 31 141 30 Q194 29 206 78 L217 163 Q230 200 213 226 Q196 244 145 246 Q95 245 66 225 Q47 207 63 162Z" fill={paint("skin")}/>
        <path d="M82 76 Q93 46 118 53 Q135 61 145 60 Q172 45 194 64 L212 153 Q207 173 153 187 Q137 191 132 199 Q123 184 104 181 Q78 174 67 156Z" fill={paint("face")}/>
        <path d="M66 157 Q85 178 115 183 Q125 185 132 200 Q137 188 153 185 Q197 177 215 159 Q230 176 234 195 L212 205 L210 233 Q179 249 143 247 Q93 247 66 228 Q52 210 58 180Z" fill={paint("shirt")}/>
        <path d="M67 160 Q88 178 115 182 Q125 186 132 198 Q139 188 153 185 Q189 179 214 160" fill="none" stroke="#FFF8EC" strokeWidth="1.2"/>
        <path d="M70 177 Q62 201 68 226 Q75 235 83 236 Q72 207 78 183Z" fill="#EDBA92" opacity=".55"/>
        <path d="M211 180 L217 202 L211 207Z" fill="#E6AE82"/><path d="M131 202 L128 220 L133 221 M106 190 Q116 196 124 195 M141 195 Q153 196 163 191" fill="none" stroke="#EDB98E" strokeWidth=".9"/>
        <g data-part="pocket"><path d="M162 204 L187 204 L186 222 Q183 231 173 230 Q160 229 162 204Z" fill="#FFE6C9" stroke="#EFC39F" strokeWidth=".8"/><path d="M171 209 L171 197 Q172 192 175 194 Q178 195 177 200 L177 211" fill="#FF7A1A"/><path d="M174 197 L174 211" stroke="#EF5B0C" strokeWidth="1.2" strokeLinecap="round"/></g>
        <g data-part="ledger" className="mj-ledger"><path d="M201 190 Q201 185 206 185 L220 187 L212 237 L195 242Z" fill="#512D10"/><path d="M204 188 L216 190 L208 236 L198 239Z" fill="#FFF0D8"/><path d="M207 190 L212 191 L204 234 L201 235Z" fill="#D3AB87"/><path d="M211 193 L221 195 L213 237 L205 240Z" fill="#72431D"/></g>
        <g data-part="hair">
          <path d="M78 84 Q71 51 96 33 Q124 10 157 21 Q188 26 189 46 Q216 43 215 85 L206 96 L197 68 Q184 51 167 53 Q151 54 142 60 Q132 60 124 54 Q106 46 94 64Z" fill={paint("hair")} stroke="#3F240E" strokeWidth=".6"/>
          <path d="M79 68 Q102 41 126 52 Q137 57 142 59 Q129 39 104 42 Q89 48 79 62Z" fill="#3B2209" opacity=".6"/>
          <g fill="none" stroke="#8A542B" strokeWidth=".7" opacity=".35"><path d="M87 47 Q117 25 140 45 Q146 53 142 58"/><path d="M101 31 Q138 16 157 36 Q166 48 144 58"/><path d="M121 24 Q164 21 171 40 Q177 49 155 54"/><path d="M143 23 Q186 30 180 45 Q176 50 167 52"/><path d="M190 49 Q210 51 213 80 Q197 72 190 49Z"/><path d="M194 51 Q194 67 211 80"/></g>
          <path d="M78 81 L87 72 L76 101 L70 108Z M205 84 L215 92 L215 111 L209 99Z" fill="#AA9180"/><path d="M78 89 L82 85 L76 98 M209 92 L214 99" stroke="#D8C2AE" strokeWidth="2" opacity=".8"/>
        </g>
        <path d="M132 71 Q143 69 152 73" fill="none" stroke="#DC865C" strokeWidth="1" opacity=".6"/>
        <g data-part="cheeks" fill={paint("cheek")}><ellipse cx="94" cy="130" rx="13" ry="12"/><ellipse cx="189" cy="139" rx="14" ry="12"/></g>
        <g className="mj-brows" data-part="eyebrows" fill="#694017">
          <path d={concerned ? "M94 88 Q101 88 113 79 Q119 83 114 87 Q101 94 94 91Z" : "M94 86 Q102 73 116 77 Q122 80 117 85 Q105 88 94 89Z"}/>
          <path d={concerned ? "M157 82 Q168 91 181 94 L182 98 Q166 94 158 88Z" : "M157 80 Q168 78 178 87 Q183 94 179 95 L158 89 Q153 85 157 80Z"}/>
        </g>
        <g className="mj-eyes" data-part="eyes">
          <path d="M89 108 Q96 88 109 94 Q121 97 122 111 Q105 120 89 108Z M151 114 Q154 94 166 99 Q179 101 181 118 Q165 123 151 114Z" fill="#FFFCF5"/>
          <g clipPath={paint("eye-left")}><g className="mj-pupils"><ellipse cx="108" cy="103" rx="9.4" ry="10.5" fill="#402400"/><ellipse cx="109" cy="102" rx="6.4" ry="7.7" fill="#241300"/><circle cx="111" cy="98" r="2.5" fill="white"/><circle cx="103" cy="95" r="1.2" fill="white"/></g></g>
          <g clipPath={paint("eye-right")}><g className="mj-pupils"><ellipse cx="165" cy="109" rx="9.5" ry="10.5" fill="#402400"/><ellipse cx="166" cy="108" rx="6.5" ry="7.7" fill="#241300"/><circle cx="168" cy="103" r="2.5" fill="white"/><circle cx="160" cy="101" r="1.2" fill="white"/></g></g>
          <path d="M89 108 Q96 88 109 94 Q121 97 122 111 M151 114 Q154 94 166 99 Q179 101 181 118" fill="none" stroke="#77471C" strokeWidth="1.2"/>
        </g>
        <g data-part="moustache" className="mj-moustache"><path d="M99 134 Q112 133 126 125 Q137 124 143 128 Q151 126 160 133 L177 143 Q159 157 139 153 Q115 151 99 134Z" fill={paint("hair")}/><g fill="none" stroke="#865025" strokeWidth=".8" opacity=".55"><path d="M111 141 L127 129 M121 147 L132 130 M134 150 L137 132 M146 150 L145 132 M158 150 L152 134 M169 146 L159 136"/></g></g>
        <path className="mj-mouth" data-part="mouth" d={concerned ? "M102 147 Q139 130 175 151" : happy ? "M98 134 Q140 174 178 143" : "M99 134 Q138 164 177 143"} fill="none" stroke="#65340C" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M99 134 Q96 133 95 136 M177 143 Q180 141 182 144" fill="none" stroke="#65340C" strokeWidth="1" strokeLinecap="round" opacity={concerned ? 0 : 1}/>
        <path d="M127 163 Q137 167 145 164 Q137 173 127 163 M114 181 Q132 193 151 182 Q134 201 114 181" fill="#DD8659" opacity=".7"/>
        <path data-part="nose" d="M135 109 Q133 117 129 125 Q128 133 140 135 Q155 135 155 125 Q149 112 150 112" fill={paint("skin")} stroke="#D8895F" strokeWidth=".7"/>
        <g className="mj-glasses" data-part="spectacles" fill="none" stroke="#382349" strokeWidth="2.5"><path d="M78 99 L66 96 M123 109 Q132 99 143 113 M190 109 L213 110"/><ellipse cx="101" cy="105" rx="23" ry="25" transform="rotate(-10 101 105)"/><ellipse cx="167" cy="111" rx="23" ry="25" transform="rotate(-10 167 111)"/><g stroke="#FFF1E2" strokeWidth=".9"><ellipse cx="101" cy="105" rx="21.3" ry="23.3" transform="rotate(-10 101 105)"/><ellipse cx="167" cy="111" rx="21.3" ry="23.3" transform="rotate(-10 167 111)"/></g></g>
        {reading && <g className="mj-document" data-part="document"><path d="M95 173 L173 177 L185 231 L107 226Z" fill="#FFF4DF" stroke="#DCB58F" strokeWidth=".8"/><path d="M164 177 L173 177 L175 188Z" fill="#EBC8A3"/><g stroke="#B99575" strokeWidth="1.5" strokeLinecap="round"><path d="M109 188 L152 190 M112 195 L163 198 M115 203 L157 205 M118 211 L143 213"/></g><path d="M176 209 Q183 202 188 209 Q198 221 186 230 Q173 236 164 226 Q158 221 164 219 L178 222 Q161 215 168 213Z" fill={paint("skin")}/></g>}
        <g className={reading ? "mj-adjust-arm" : wave ? "mj-wave-arm" : "mj-rest-arm"} data-part="right-arm"><path d="M67 177 Q53 185 43 171 L31 151 L47 142 Q52 154 72 159Z" fill={paint("shirt")}/><path d="M43 166 Q49 166 52 157 L47 148 L34 153Z" fill="#EEC099" opacity=".55"/><path d="M34 155 Q23 145 18 128 Q12 109 21 105 Q27 100 33 110 L39 120 Q46 112 49 119 Q51 127 46 140 Q44 149 34 155Z" fill={paint("skin")}/><path d="M19 111 Q14 127 29 145" fill="none" stroke="#DF8F61" strokeWidth="1" opacity=".7"/></g>
        {reading && <g className="mj-touch-hand" data-part="glasses-hand"><path d="M77 151 Q68 143 75 133 L101 111 Q110 104 113 111 Q114 115 104 122 L95 131 Q110 123 114 130 Q114 136 105 140 L94 153 Q85 160 77 151Z" fill={paint("skin")}/><path d="M82 145 L100 129 M87 149 L105 136" fill="none" stroke="#DC8A5B" strokeWidth="1"/></g>}
      </g>
    </svg>
  );
}
