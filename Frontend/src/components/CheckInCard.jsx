import { useCallback, useEffect, useRef, useState } from "react";
import API from "../services/api";
import toast from "react-hot-toast";
import {
  Camera,
  CheckCircle2,
  Clock,
  Loader2,
  LogIn,
  LogOut,
  MapPin,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";

const timeLabel = (value) =>
  value
    ? new Date(value).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const statusTone = {
  present: "bg-[#e9f3eb] text-[#2f6b50] ring-[#2f6b50]/20",
  late: "bg-[#fdf0df] text-[#a96820] ring-[#a96820]/20",
  half_day: "bg-[#f8eadb] text-[#a05a1e] ring-[#a05a1e]/20",
  on_leave: "bg-[#e8f1f7] text-[#2d6384] ring-[#2d6384]/20",
  absent: "bg-[#fbeae5] text-[#a8442b] ring-[#a8442b]/20",
  missing_checkout: "bg-rose-50 text-rose-700 ring-rose-600/20",
};

const fetchToday = () => API.get("/attendance/today/me");

const reportTodayError = (error) => {
  if (error.response?.status !== 400) {
    toast.error(
      error.response?.data?.message || "Could not load today's attendance",
    );
  }
};

function CameraCheckIn({ settings, onClose, onSuccess }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const frameRef = useRef(null);
  const [cameraState, setCameraState] = useState("starting");
  const [cameraError, setCameraError] = useState("");
  const [location, setLocation] = useState(null);
  const [locationState, setLocationState] = useState("locating");
  const [locationError, setLocationError] = useState("");
  const [faces, setFaces] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [faceApiSupported, setFaceApiSupported] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const stopCamera = () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };

    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraState("error");
        setCameraError(
          "Camera access needs HTTPS or localhost in a modern browser.",
        );
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 960 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setCameraState("ready");

        if ("FaceDetector" in window) {
          try {
            detectorRef.current = new window.FaceDetector({
              fastMode: true,
              maxDetectedFaces: 3,
            });
            setFaceApiSupported(true);
            const detect = async () => {
              if (
                !detectorRef.current ||
                !videoRef.current ||
                videoRef.current.readyState < 2
              ) {
                frameRef.current = requestAnimationFrame(detect);
                return;
              }
              try {
                const results = await detectorRef.current.detect(
                  videoRef.current,
                );
                if (!cancelled) setFaces(results?.length || 0);
              } catch {
                if (!cancelled) setFaces(0);
              }
              if (!cancelled) frameRef.current = requestAnimationFrame(detect);
            };
            frameRef.current = requestAnimationFrame(detect);
          } catch {
            setFaceApiSupported(false);
          }
        }
      } catch (err) {
        setCameraState("error");
        setCameraError(
          err?.name === "NotAllowedError"
            ? "Camera permission was denied. Allow camera access and try again."
            : "We could not start the camera. Check your device and browser.",
        );
      }
    };

    const readLocation = () => {
      if (!navigator.geolocation) {
        setLocationState("error");
        setLocationError("Location is not available in this browser.");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (cancelled) return;
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
          setLocationState("ready");
        },
        (err) => {
          if (cancelled) return;
          setLocationState("error");
          setLocationError(
            err?.code === 1
              ? "Location permission was denied. Camera check-in needs your location."
              : "We could not read your location. Move near a window and retry.",
          );
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
      );
    };

    startCamera();
    readLocation();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, []);

  const retryLocation = () => {
    setLocationState("locating");
    setLocationError("");
    navigator.geolocation?.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLocationState("ready");
      },
      () => {
        setLocationState("error");
        setLocationError("Location is still unavailable. Try again outdoors.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  const submitCamera = async () => {
    setError("");
    if (!location) {
      setError("Wait for a valid location before checking in.");
      return;
    }
    if (faceApiSupported && faces !== 1) {
      setError(
        faces > 1
          ? "Only one face should be visible in the frame."
          : "Position one clear face inside the frame.",
      );
      return;
    }
    setSubmitting(true);
    try {
      await API.post("/attendance/check-in", {
        source: "camera",
        location,
        faceDetectionSupported: faceApiSupported,
        faceDetected: faceApiSupported ? faces === 1 : true,
      });
      toast.success("Camera check-in saved");
      onSuccess();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Camera check-in failed. You can still use web check-in.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const ready =
    cameraState === "ready" &&
    locationState === "ready" &&
    (!faceApiSupported || faces === 1);

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[94vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
              Camera attendance
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">
              Verify and check in
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close camera check-in"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-900">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              {cameraState === "ready" && faceApiSupported ? (
                <div
                  className={`h-48 w-40 rounded-[45%] border-2 transition ${
                    faces === 1
                      ? "border-emerald-400 shadow-[0_0_0_9999px_rgba(2,6,23,0.35)]"
                      : "border-white/70 shadow-[0_0_0_9999px_rgba(2,6,23,0.55)]"
                  }`}
                />
              ) : null}
            </div>
            {cameraState !== "ready" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center text-white">
                {cameraState === "starting" ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <p className="text-sm">Starting camera...</p>
                  </>
                ) : (
                  <>
                    <Camera className="h-7 w-7 text-rose-300" />
                    <p className="text-sm text-rose-100">{cameraError}</p>
                  </>
                )}
              </div>
            )}
            <div className="absolute bottom-3 left-3 flex flex-wrap gap-2 text-[11px] font-medium">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-slate-800">
                <MapPin className="h-3 w-3" />
                {locationState === "ready"
                  ? `${Math.round(location.accuracy)}m accuracy`
                  : "Locating..."}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-slate-800">
                <ShieldCheck className="h-3 w-3" />
                {faceApiSupported
                  ? faces === 1
                    ? "Face detected"
                    : "Show one face"
                  : "Camera + location"}
              </span>
            </div>
          </div>

          {!settings?.officeConfigured && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Office coordinates are not set. Ask Admin to configure the office
              location before using camera check-in.
            </div>
          )}

          {locationError && (
            <div className="flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <span>{locationError}</span>
              <button
                type="button"
                onClick={retryLocation}
                className="inline-flex shrink-0 items-center gap-1 font-medium underline"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </button>
            </div>
          )}

          {!faceApiSupported && cameraState === "ready" && (
            <p className="rounded-xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
              This browser does not expose face detection. Camera check-in will
              still verify the office geofence, and the result is recorded as
              camera-sourced.
            </p>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
            >
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={submitCamera}
              disabled={!ready || submitting}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
              {submitting ? "Checking in..." : "Confirm camera check-in"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Use web instead
            </button>
          </div>
          <p className="text-center text-[11px] leading-5 text-slate-400">
            Only the verification result and location are stored. No photo is
            uploaded.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CheckInCard({ className = "", compact = false }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);

  const loadToday = useCallback(async () => {
    try {
      const response = await fetchToday();
      setData(response.data);
    } catch (error) {
      reportTodayError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchToday()
      .then((response) => {
        if (active) setData(response.data);
      })
      .catch((error) => {
        if (active) reportTodayError(error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const attendance = data?.attendance;
  const checkedIn = Boolean(attendance?.checkIn);
  const checkedOut = Boolean(attendance?.checkOut);

  const markAttendance = async (action) => {
    setBusy(action);
    try {
      await API.post(`/attendance/${action}`);
      toast.success(action === "check-in" ? "Checked in" : "Checked out");
      await loadToday();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          `Could not ${action === "check-in" ? "check in" : "check out"}`,
      );
    } finally {
      setBusy("");
    }
  };

  const tone =
    statusTone[attendance?.status] ||
    "bg-[#f0ece2] text-hcm-muted ring-hcm-line";

  return (
    <>
      <section
        className={`relative overflow-hidden rounded-3xl border border-hcm-line bg-hcm-surface shadow-hcm ${className}`}
        aria-labelledby="today-attendance-title"
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-hcm-accent via-[#76b85a] to-hcm-lime" />
        <div className={compact ? "p-5" : "p-5 sm:p-6"}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="hcm-eyebrow">
                <span className="h-1.5 w-1.5 rounded-full bg-hcm-lime" />
                Today
              </p>
              <h2
                id="today-attendance-title"
                className="mt-1.5 text-lg font-semibold tracking-tight text-hcm-ink"
              >
                Your attendance
              </h2>
            </div>
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-[#b5b0a4]" />
            ) : (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${tone}`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {attendance?.status?.replace("_", " ") || "Not checked in"}
              </span>
            )}
          </div>

          <div className="mt-5 grid grid-cols-3 divide-x divide-hcm-line rounded-2xl border border-hcm-line bg-[#faf7f0] px-2 py-3.5 text-center">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-hcm-muted">
                Check in
              </p>
              <p className="mt-1 text-sm font-semibold text-hcm-ink">
                {timeLabel(attendance?.checkIn)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-hcm-muted">
                Check out
              </p>
              <p className="mt-1 text-sm font-semibold text-hcm-ink">
                {timeLabel(attendance?.checkOut)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-hcm-muted">
                Hours
              </p>
              <p className="mt-1 text-sm font-semibold text-hcm-ink">
                {attendance?.hoursWorked || 0}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            {!checkedIn && (
              <>
                <button
                  type="button"
                  onClick={() => markAttendance("check-in")}
                  disabled={Boolean(busy)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-hcm-ink px-4 py-3 text-sm font-semibold text-hcm-surface shadow-[0_12px_28px_-18px_rgba(16,37,31,0.8)] transition hover:bg-hcm-ink-soft disabled:opacity-60"
                >
                  {busy === "check-in" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogIn className="h-4 w-4" />
                  )}
                  Web check-in
                </button>
                <button
                  type="button"
                  onClick={() => setCameraOpen(true)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-hcm-line bg-white px-4 py-3 text-sm font-semibold text-hcm-accent transition hover:border-hcm-line-strong hover:bg-[#faf7f0]"
                >
                  <Camera className="h-4 w-4" />
                  Camera + location
                </button>
              </>
            )}

            {checkedIn && !checkedOut && (
              <button
                type="button"
                onClick={() => markAttendance("check-out")}
                disabled={Boolean(busy)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-hcm-danger px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#913a25] disabled:opacity-60"
              >
                {busy === "check-out" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                Check out
              </button>
            )}

            {checkedOut && (
              <div className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#cfe2d3] bg-[#e9f3eb] px-4 py-3 text-sm font-semibold text-[#2f6b50]">
                <CheckCircle2 className="h-4 w-4" />
                Day complete — {attendance.hoursWorked || 0} hours logged
              </div>
            )}
          </div>

          <p className="mt-3 flex items-center gap-1.5 text-[10px] leading-5 text-hcm-muted">
            <Clock className="h-3.5 w-3.5" />
            Server time is authoritative. Late after{" "}
            {data?.settings?.officeStartTime || "09:00"} +{" "}
            {data?.settings?.graceMinutes ?? 15} min grace.
          </p>
        </div>
      </section>

      {cameraOpen && (
        <CameraCheckIn
          settings={data?.settings}
          onClose={() => setCameraOpen(false)}
          onSuccess={loadToday}
        />
      )}
    </>
  );
}
