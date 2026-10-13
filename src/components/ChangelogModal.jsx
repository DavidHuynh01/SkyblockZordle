import { CHANGELOG, CURRENT_VERSION } from "../data/changelog.js";

const SEEN_KEY = "skyblockzordle-seen-version";

// True when there's a release this browser hasn't opened the dialog for yet.
export function hasUnseenUpdate() {
  try {
    return localStorage.getItem(SEEN_KEY) !== CURRENT_VERSION;
  } catch {
    return false;
  }
}

export function markUpdatesSeen() {
  try {
    localStorage.setItem(SEEN_KEY, CURRENT_VERSION);
  } catch {
    /* ignore */
  }
}

function fmtDate(iso) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

// "What's new" dialog opened from the version link on the menu.
export default function ChangelogModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="mc-panel w-full max-w-md p-6 animate-pop max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mc-title mc-title-sm text-xl sm:text-2xl text-center mb-5">
          What's new
        </h2>

        <ol className="space-y-5">
          {CHANGELOG.map((release, i) => (
            <li key={release.version}>
              <div className="flex items-baseline justify-between gap-3 mb-2">
                <span className="text-[11px] text-paneldark">
                  v{release.version} · {release.title}
                  {i === 0 && (
                    <span className="ml-2 px-1 py-0.5 text-[7px] text-white bg-[#3f7d2e] align-middle">
                      LATEST
                    </span>
                  )}
                </span>
                <span className="text-[8px] text-paneldark opacity-60 whitespace-nowrap">
                  {fmtDate(release.date)}
                </span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-[9px] text-paneldark leading-relaxed">
                {release.changes.map((change) => (
                  <li key={change}>{change}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>

        <div className="flex justify-center mt-6">
          <button className="mc-btn text-[10px]" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
