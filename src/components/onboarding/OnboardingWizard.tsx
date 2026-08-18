import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSettingsStore } from '@/stores/settingsStore'
import { Icon, Button, Input, Field, Select } from '@/components/ui'
import { cn } from '@/utils/cn'

const STEPS = [
  { id: 'welcome', progress: 50, label: 'Welcome' },
  { id: 'name', progress: 70, label: 'Your Name' },
  { id: 'exam', progress: 85, label: 'Target Exam' },
  { id: 'goals', progress: 100, label: 'Goals' },
  { id: 'complete', progress: 100, label: 'All Set' },
] as const

export default function OnboardingWizard() {
  const navigate = useNavigate()
  const set = useSettingsStore((s) => s.set)
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [exam, setExam] = useState<'jee-main' | 'jee-advanced'>('jee-main')
  const [year, setYear] = useState(2027)
  const [dailyGoal, setDailyGoal] = useState(30)

  const current = STEPS[step]!

  const handleNext = () => {
    if (step === 1 && !name.trim()) return
    if (step < STEPS.length - 1) {
      setStep(step + 1)
    }
  }

  const handleComplete = () => {
    set({
      userName: name.trim() || 'Aspirant',
      examTarget: exam,
      targetYear: year,
      dailyGoal,
      onboarded: true,
      onboardingStep: 4,
    })
    navigate('/dashboard', { replace: true })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleNext()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg">
      <div className="w-full max-w-md px-6">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text3">
              {current.label}
            </span>
            <span className="text-[11px] font-mono text-text3">
              {current.progress}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface3">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${current.progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {step === 0 && (
              <div className="space-y-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Icon name="target" size={28} className="text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-text">
                    You're already halfway there.
                  </h1>
                  <p className="mt-2 text-sm leading-relaxed text-text2">
                    Starting is the hardest part — and you've already done it.
                    Let's set up your profile so we can personalize your experience.
                  </p>
                </div>
                <Button onClick={handleNext} size="lg" className="w-full">
                  Continue
                  <Icon name="arrow-right" size={16} />
                </Button>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-text">
                    What should we call you?
                  </h1>
                  <p className="mt-2 text-sm text-text2">
                    We'll use this to personalize your dashboard.
                  </p>
                </div>
                <Field label="Your Name">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter your name"
                    autoFocus
                  />
                </Field>
                <Button
                  onClick={handleNext}
                  size="lg"
                  className="w-full"
                  disabled={!name.trim()}
                >
                  Continue
                  <Icon name="arrow-right" size={16} />
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-text">
                    Which exam are you targeting?
                  </h1>
                  <p className="mt-2 text-sm text-text2">
                    We'll customize your test series and practice accordingly.
                  </p>
                </div>
                <div className="grid gap-3">
                  <button
                    onClick={() => setExam('jee-main')}
                    className={cn(
                      'flex items-center gap-4 rounded-xl border-2 p-5 text-left transition-all',
                      exam === 'jee-main'
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-surface hover:border-border2',
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-xl',
                        exam === 'jee-main' ? 'bg-primary/15 text-primary' : 'bg-surface2 text-text3',
                      )}
                    >
                      <Icon name="test" size={24} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-text">JEE Main</p>
                      <p className="text-xs text-text2">MCQ + Integer format, 300 marks</p>
                    </div>
                    {exam === 'jee-main' && (
                      <Icon name="check-circle" size={20} className="text-primary" />
                    )}
                  </button>
                  <button
                    onClick={() => setExam('jee-advanced')}
                    className={cn(
                      'flex items-center gap-4 rounded-xl border-2 p-5 text-left transition-all',
                      exam === 'jee-advanced'
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-surface hover:border-border2',
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-xl',
                        exam === 'jee-advanced' ? 'bg-primary/15 text-primary' : 'bg-surface2 text-text3',
                      )}
                    >
                      <Icon name="award" size={24} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-text">JEE Advanced</p>
                      <p className="text-xs text-text2">MCQ + MSQ + Integer, 360 marks per paper</p>
                    </div>
                    {exam === 'jee-advanced' && (
                      <Icon name="check-circle" size={20} className="text-primary" />
                    )}
                  </button>
                </div>
                <Button onClick={handleNext} size="lg" className="w-full">
                  Continue
                  <Icon name="arrow-right" size={16} />
                </Button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-text">
                    Set your goals
                  </h1>
                  <p className="mt-2 text-sm text-text2">
                    One last thing — when's your exam and how much do you want to practice daily?
                  </p>
                </div>
                <div className="space-y-4">
                  <Field label="Target Exam Year">
                    <Select value={year} onChange={(e) => setYear(Number(e.target.value))}>
                      <option value={2027}>2027</option>
                      <option value={2028}>2028</option>
                    </Select>
                  </Field>
                  <Field label={`Daily Goal: ${dailyGoal} questions`}>
                    <input
                      type="range"
                      min={5}
                      max={100}
                      step={5}
                      value={dailyGoal}
                      onChange={(e) => setDailyGoal(Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-[10px] text-text3 mt-1">
                      <span>5</span>
                      <span>50</span>
                      <span>100</span>
                    </div>
                  </Field>
                </div>
                <Button onClick={handleNext} size="lg" className="w-full">
                  Continue
                  <Icon name="arrow-right" size={16} />
                </Button>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
                  <Icon name="check-circle" size={32} className="text-success" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-text">
                    You're all set, {name || 'Aspirant'}.
                  </h1>
                  <p className="mt-2 text-sm text-text2">
                    Your {exam === 'jee-main' ? 'JEE Main' : 'JEE Advanced'} test series is ready.
                    Let's begin.
                  </p>
                </div>
                <Button onClick={handleComplete} size="lg" className="w-full">
                  Go to Dashboard
                  <Icon name="arrow-right" size={16} />
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Step indicators */}
        <div className="mt-8 flex items-center justify-center gap-2">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => i < step && setStep(i)}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i <= step ? 'bg-primary' : 'bg-surface3',
                i === step ? 'w-6' : 'w-1.5',
                i < step && 'cursor-pointer hover:bg-primary/70',
              )}
              aria-label={`Step ${i + 1}: ${s.label}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
