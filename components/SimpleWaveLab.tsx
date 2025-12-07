
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronDown, ChevronUp, Play, Pause, RotateCcw, Zap, Waves, Cpu } from 'lucide-react';

// Cấu hình ban đầu
const INITIAL_CONFIG = {
  amplitude: 50,
  frequency: 1, // Hz
  waveSpeed: 50, // pixel/s
  waveType: 'transverse', // 'transverse' (ngang) hoặc 'longitudinal' (dọc)
  isRunning: true,
  scale: 1.0, // Tỷ lệ phóng to
};

// Component con để hiển thị thông số tính toán
const ParamDisplay = ({ label, value, unit, formula }: { label: string, value: string, unit: string, formula: string }) => (
  <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg shadow-sm">
    <span className="text-sm font-medium text-gray-700">{label}</span>
    <div className="text-right">
      <span className="text-base font-bold text-blue-800 mr-1">{value}</span>
      <span className="text-xs text-blue-600">{unit}</span>
      <p className="text-xs text-gray-500 italic mt-0.5">({formula})</p>
    </div>
  </div>
);

/**
 * Component chính của ứng dụng mô phỏng sóng vật lý.
 * Sử dụng Tailwind CSS cho giao diện và Canvas API cho mô phỏng.
 */
export const SimpleWaveLab = () => {
  const [config, setConfig] = useState(INITIAL_CONFIG);
  const [time, setTime] = useState(0);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  // Tham chiếu để giữ requestAnimationFrame ID
  const animationRef = React.useRef<number>(0);
  // Tham chiếu để lưu trữ thời điểm khung hình trước
  const lastTimeRef = React.useRef(0);

  // Tính toán các đại lượng sóng phái sinh
  const derivedParams = useMemo(() => {
    const period = 1 / config.frequency; // Chu kỳ T (giây)
    const wavelength = config.waveSpeed / config.frequency; // Bước sóng Lambda (pixel)
    const waveNumber = (2 * Math.PI) / wavelength; // Số sóng k
    const angularFrequency = 2 * Math.PI * config.frequency; // Tần số góc omega

    return {
      period: period.toFixed(2),
      wavelength: wavelength.toFixed(2),
      waveNumber: waveNumber.toFixed(2),
      angularFrequency: angularFrequency.toFixed(2),
    };
  }, [config.frequency, config.waveSpeed]);

  // Hàm vẽ chính
  const drawWave = useCallback((ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number, t: number) => {
    if (!ctx) return;

    // Thiết lập thông số
    const { amplitude, frequency, waveSpeed, waveType, scale } = config;

    // Các hằng số hình học
    const centerY = canvasHeight / 2;
    const paddingX = 40; // Khoảng đệm cho trục X
    const visibleWidth = canvasWidth - 2 * paddingX;
    const wavelength = waveSpeed / frequency; // Bước sóng
    const waveNumber = (2 * Math.PI) / wavelength; // k
    const angularFrequency = 2 * Math.PI * frequency; // omega

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // --- 1. Vẽ trục tọa độ (Trục X) ---
    ctx.strokeStyle = '#374151'; // Màu xám đậm
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(paddingX, centerY);
    ctx.lineTo(canvasWidth - paddingX, centerY);
    ctx.stroke();

    // Vẽ điểm gốc (Source)
    ctx.fillStyle = '#ef4444'; // Đỏ
    ctx.beginPath();
    ctx.arc(paddingX, centerY, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#374151';
    ctx.font = '12px sans-serif';
    ctx.fillText('Nguồn Sóng (O)', paddingX - 10, centerY + 20);

    // --- 2. Vẽ Sóng và các Hạt Môi Trường ---
    const pointCount = 500; // Số lượng hạt để mô phỏng
    const particleRadius = 3;
    ctx.beginPath();
    ctx.strokeStyle = '#2563eb'; // Xanh lam
    ctx.lineWidth = 3 * scale;
    ctx.moveTo(paddingX, centerY);

    const particles = [];

    // Lặp qua các điểm trên trục X
    for (let i = 0; i <= pointCount; i++) {
      const x = paddingX + (i / pointCount) * visibleWidth; // Vị trí x thực tế
      const distance = x - paddingX; // Khoảng cách từ nguồn O (d)

      // Phương trình sóng tại x, thời điểm t: u(x, t) = A * cos(wt - kx)
      // Lưu ý: Chỉ truyền sóng sau khi t - d/v >= 0
      const phase = angularFrequency * (t - distance / waveSpeed);
      let displacement = 0; // Độ lệch

      if (t * waveSpeed >= distance) {
        displacement = amplitude * Math.cos(phase);
      }

      // Vị trí hạt y (độ lệch so với trục X)
      let particleX = x;
      let particleY = centerY - displacement;

      if (waveType === 'transverse') {
        // Sóng ngang: dao động vuông góc với phương truyền (theo trục Y)
        particleX = x;
        particleY = centerY - displacement * scale;
        ctx.lineTo(particleX, particleY);
      } else {
        // Sóng dọc: dao động trùng với phương truyền (theo trục X)
        // Độ lệch của hạt là theo trục X
        particleX = x + displacement * scale * 0.5; // Giảm biên độ dao động X một chút
        particleY = centerY;
      }

      // Thêm hạt vào danh sách để vẽ sau
      particles.push({ x: particleX, y: particleY });
    }

    // Vẽ đường bao (chỉ cho sóng ngang)
    if (waveType === 'transverse') {
      ctx.stroke();
    }

    // --- 3. Vẽ các Hạt Môi Trường (Particle) ---
    particles.forEach(p => {
      ctx.fillStyle = '#059669'; // Xanh lá cây
      ctx.beginPath();
      ctx.arc(p.x, p.y, particleRadius * scale, 0, 2 * Math.PI);
      ctx.fill();
    });

    // --- 4. Hiển thị Bước Sóng (Lambda) ---
    if (wavelength <= visibleWidth && wavelength > 50) { // Chỉ hiển thị nếu đủ lớn
      const lambdaStart = paddingX;
      const lambdaEnd = paddingX + wavelength;

      ctx.strokeStyle = '#f59e0b'; // Vàng cam
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1;

      // Đường thẳng đứng tại điểm bắt đầu và kết thúc một bước sóng
      ctx.beginPath();
      ctx.moveTo(lambdaStart, centerY + 10);
      ctx.lineTo(lambdaStart, centerY + 50);
      ctx.moveTo(lambdaEnd, centerY + 10);
      ctx.lineTo(lambdaEnd, centerY + 50);
      ctx.stroke();
      ctx.setLineDash([]); // Tắt nét đứt

      // Mũi tên và nhãn Lambda
      ctx.beginPath();
      ctx.moveTo(lambdaStart, centerY + 30);
      ctx.lineTo(lambdaEnd, centerY + 30);
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'italic bold 16px serif';
      ctx.fillText('λ (Bước Sóng)', lambdaStart + (wavelength / 2) - 30, centerY + 45);
    }

    // --- 5. Hiển thị Thời gian ---
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`Thời gian: ${t.toFixed(2)} s`, canvasWidth - 150, 30);

  }, [config, derivedParams.wavelength]); // Thêm derivedParams.wavelength vào dep array

  // Vòng lặp Animation
  const animate = useCallback((currentTime: number) => {
    const deltaTime = (currentTime - lastTimeRef.current) / 1000;
    lastTimeRef.current = currentTime;

    if (config.isRunning) {
      // Cập nhật thời gian: tốc độ chậm hơn để dễ quan sát
      setTime(prevTime => prevTime + deltaTime * 0.8);
    }

    if (ctx && canvas) {
      drawWave(ctx, canvas.width, canvas.height, time);
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [config.isRunning, ctx, canvas, time, drawWave]);

  // Khởi tạo Canvas và Context khi component mount
  useEffect(() => {
    const canvasElement = document.getElementById('wave-canvas') as HTMLCanvasElement;
    if (canvasElement) {
      const parent = canvasElement.parentElement;
      if (parent) {
        // Đặt kích thước canvas bằng kích thước container
        canvasElement.width = parent.clientWidth;
        canvasElement.height = Math.min(parent.clientHeight, 400);

        setCanvas(canvasElement);
        const newCtx = canvasElement.getContext('2d');
        setCtx(newCtx);
        if (newCtx) newCtx.imageSmoothingEnabled = true; // Bật làm mịn ảnh
      }
    }
  }, []);

  // Bắt đầu/Dừng vòng lặp animation
  useEffect(() => {
    if (ctx && canvas) {
      lastTimeRef.current = performance.now();
      animationRef.current = requestAnimationFrame(animate);
    }
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [animate, ctx, canvas]);

  // Xử lý sự kiện thay đổi Input
  const handleConfigChange = (key: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      [key]: parseFloat(value),
    }));
  };

  const handleToggleRunning = () => {
    setConfig(prev => ({ ...prev, isRunning: !prev.isRunning }));
  };

  const handleReset = () => {
    setConfig(INITIAL_CONFIG);
    setTime(0);
  };

  const handleResize = () => {
    const canvasElement = document.getElementById('wave-canvas') as HTMLCanvasElement;
    if (canvasElement) {
      const parent = canvasElement.parentElement;
      if (parent) {
        canvasElement.width = parent.clientWidth;
        canvasElement.height = Math.min(parent.clientHeight, 400);
        // Buộc vẽ lại sau khi thay đổi kích thước
        if (ctx && canvas) {
            drawWave(ctx, canvasElement.width, canvasElement.height, time);
        }
      }
    }
  };

  // Đăng ký sự kiện resize của cửa sổ
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [ctx, canvas, time, drawWave]); // Thêm dependencies cần thiết

  // Hàm tạo Input Slider
  const SliderInput = ({ label, icon: Icon, value, min, max, step, unit, name }: any) => (
    <div className="space-y-1 p-2 bg-gray-50 rounded-lg shadow-inner">
      <div className="flex justify-between items-center text-sm font-medium text-gray-700">
        <div className="flex items-center">
          <Icon className="w-4 h-4 mr-2 text-blue-600" />
          <span>{label}</span>
        </div>
        <span className="font-bold text-blue-600">{value.toFixed(2)} {unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => handleConfigChange(name, e.target.value)}
        className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer range-lg"
      />
    </div>
  );

  return (
    <div className="h-full bg-gray-50 flex flex-col p-4 sm:p-6 font-sans overflow-hidden">
      <header className="text-center mb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-700 tracking-tight">
          Mô Phỏng Sóng Vật Lý
        </h1>
        <p className="text-gray-500 mt-2">
          Quan sát sự truyền sóng cơ học và các đại lượng đặc trưng.
        </p>
      </header>

      {/* Khu vực mô phỏng */}
      <div className="flex-grow bg-white rounded-xl shadow-2xl overflow-hidden mb-6 p-2 border-4 border-blue-100 relative">
        <canvas id="wave-canvas" className="w-full h-full"></canvas>
      </div>

      {/* Bảng điều khiển và Thông tin */}
      <div className="bg-white rounded-xl shadow-xl p-4 sm:p-6 border border-gray-200 overflow-y-auto">
        {/* Nút bật/tắt Panel */}
        <button
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          className="w-full flex justify-between items-center p-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition-all text-blue-700 font-semibold mb-3"
        >
          <span>{isPanelOpen ? 'Thu gọn Bảng Điều Khiển' : 'Mở rộng Bảng Điều Khiển'}</span>
          {isPanelOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>

        <div className={`transition-all duration-300 overflow-hidden ${isPanelOpen ? 'max-h-screen opacity-100 pt-2' : 'max-h-0 opacity-0'}`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Cột 1: Điều khiển chính */}
            <div className="md:col-span-1 space-y-4">
              <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-2">Đại Lượng Đầu Vào</h3>
              <SliderInput
                label="Biên Độ (Amplitude, A)"
                icon={Waves}
                value={config.amplitude}
                min={10}
                max={100}
                step={5}
                unit="pixel"
                name="amplitude"
              />
              <SliderInput
                label="Tần Số (Frequency, f)"
                icon={Zap}
                value={config.frequency}
                min={0.1}
                max={5}
                step={0.1}
                unit="Hz"
                name="frequency"
              />
              <SliderInput
                label="Tốc Độ Sóng (Wave Speed, v)"
                icon={Cpu}
                value={config.waveSpeed}
                min={10}
                max={150}
                step={5}
                unit="pixel/s"
                name="waveSpeed"
              />

              <div className="flex items-center space-x-4 p-2 bg-gray-50 rounded-lg shadow-inner">
                <label className="text-sm font-medium text-gray-700">Loại Sóng:</label>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setConfig(p => ({ ...p, waveType: 'transverse' }))}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${config.waveType === 'transverse' ? 'bg-green-500 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-300 hover:bg-green-50'}`}
                  >
                    Sóng Ngang
                  </button>
                  <button
                    onClick={() => setConfig(p => ({ ...p, waveType: 'longitudinal' }))}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${config.waveType === 'longitudinal' ? 'bg-green-500 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-300 hover:bg-green-50'}`}
                  >
                    Sóng Dọc
                  </button>
                </div>
              </div>

            </div>

            {/* Cột 2: Đại lượng phái sinh */}
            <div className="md:col-span-1 space-y-4">
              <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-2">Đại Lượng Tính Toán</h3>
              <div className="space-y-2">
                <ParamDisplay
                  label="Chu Kỳ (Period, T)"
                  value={derivedParams.period}
                  unit="s"
                  formula={`T = 1/f`}
                />
                <ParamDisplay
                  label="Bước Sóng (Wavelength, \u03bb)"
                  value={derivedParams.wavelength}
                  unit="pixel"
                  formula={`\\lambda = v/f`}
                />
                <ParamDisplay
                  label="Tần Số Góc (Angular Freq, \u03c9)"
                  value={derivedParams.angularFrequency}
                  unit="rad/s"
                  formula={`\\omega = 2\\pi f`}
                