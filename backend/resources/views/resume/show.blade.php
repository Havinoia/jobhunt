<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Career Analysis Detail — {{ $resume->original_filename }}</title>
    <!-- Google Fonts: Inter & Outfit -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@700;800&display=swap" rel="stylesheet">
    <!-- Google Symbols -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
    <!-- Tailwind CSS (via CDN for simplicity) -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: '#6366f1', // Indigo
                        secondary: '#10b981', // Emerald
                        surface: '#f8fafc',
                    },
                    fontFamily: {
                        sans: ['Inter', 'sans-serif'],
                        headline: ['Outfit', 'sans-serif'],
                    }
                }
            }
        }
    </script>
    <style>
        .glass-card {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(0, 0, 0, 0.05);
        }
    </style>
</head>
<body class="bg-slate-50 min-h-screen text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">

    <!-- ═══ Nav ═══ -->
    <nav class="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4">
        <div class="max-w-5xl mx-auto flex justify-between items-center">
            <div class="flex items-center gap-2">
                <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200">
                    <span class="material-symbols-outlined text-white text-lg font-bold">bolt</span>
                </div>
                <span class="text-xl font-headline font-extrabold tracking-tight text-slate-800">JobHunt</span>
            </div>
            <div class="hidden sm:block text-slate-500 text-sm font-medium">
                Analysis Date: {{ $resume->updated_at->format('M d, Y') }}
            </div>
        </div>
    </nav>

    <main class="max-w-5xl mx-auto p-6 md:p-10 space-y-12">
        <!-- ═══ Header Section ═══ -->
        <header class="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div class="space-y-2">
                <h1 class="text-4xl md:text-5xl font-headline font-black text-slate-900 leading-none">
                    Career Analysis <span class="text-primary">Detail</span>
                </h1>
                <p class="text-slate-500 font-medium text-lg flex items-center gap-2">
                    <span class="material-symbols-outlined text-sm">description</span>
                    {{ $resume->original_filename }}
                </p>
            </div>
            <div class="flex gap-3">
                <div class="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                    <span class="text-sm font-bold text-indigo-700 tracking-wide uppercase">
                        {{ $report['analysis_metadata']['career_level'] ?? 'Junior' }}
                    </span>
                </div>
                <div class="px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-full flex items-center gap-2">
                    <span class="text-sm font-bold text-emerald-700 tracking-wide uppercase">
                        {{ $report['analysis_metadata']['primary_domain'] ?? 'General' }}
                    </span>
                </div>
            </div>
        </header>

        <hr class="border-slate-200">

        <!-- ═══ Skill Grid ═══ -->
        <section class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Hard Skills -->
            <div class="glass-card rounded-3xl p-8 shadow-sm">
                <div class="flex items-center gap-3 mb-6">
                    <div class="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-primary">
                        <span class="material-symbols-outlined font-bold">terminal</span>
                    </div>
                    <h3 class="text-xl font-headline font-bold text-slate-800">Hard Core Skills</h3>
                </div>
                <div class="flex flex-wrap gap-2">
                    @foreach($report['extracted_data']['skills_hard'] ?? [] as $skill)
                        <span class="bg-white border border-slate-100 px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-primary hover:text-primary hover:shadow-md cursor-default">
                            {{ is_array($skill) ? $skill['name'] : $skill }}
                        </span>
                    @endforeach
                </div>
            </div>

            <!-- Soft & Tools -->
            <div class="space-y-8">
                <div class="glass-card rounded-3xl p-8 shadow-sm h-full">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-secondary">
                            <span class="material-symbols-outlined font-bold">diversity_3</span>
                        </div>
                        <h3 class="text-xl font-headline font-bold text-slate-800">Interpersonal & Cultural</h3>
                    </div>
                    <div class="flex flex-wrap gap-2">
                        @foreach($report['extracted_data']['skills_soft'] ?? [] as $skill)
                            <span class="bg-white border border-slate-100 px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 shadow-sm hover:border-secondary hover:text-secondary transition-all">
                                {{ is_array($skill) ? $skill['name'] : $skill }}
                            </span>
                        @endforeach
                    </div>
                </div>
            </div>
        </section>

        <!-- ═══ Gap Analysis ═══ -->
        <section class="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden group">
            <div class="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] -mr-32 -mt-32"></div>
            
            <div class="relative z-10 flex flex-col md:flex-row gap-12">
                <div class="md:w-1/3 space-y-4">
                    <h2 class="text-2xl font-headline font-black tracking-tight leading-tight">Skill Gap & <br><span class="text-primary">Upskilling Guide</span></h2>
                    <p class="text-slate-400 text-sm leading-relaxed">
                        {{ $report['skill_gap_analysis']['upskilling_suggestion'] ?? 'No suggestions yet.' }}
                    </p>
                </div>

                <div class="md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    @foreach($report['skill_gap_analysis']['missing_common_skills'] ?? [] as $gap)
                        <div class="bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-colors">
                            <div class="flex justify-between items-start mb-2">
                                <span class="font-bold text-lg text-white">
                                    {{ is_array($gap) ? $gap['name'] : $gap }}
                                </span>
                                <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest {{ (is_array($gap) && $gap['importance'] === 'high') ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400' }}">
                                    {{ is_array($gap) ? $gap['importance'] : 'high' }}
                                </span>
                            </div>
                            <p class="text-slate-400 text-xs leading-relaxed italic">
                                {{ is_array($gap) ? $gap['reason'] : '' }}
                            </p>
                        </div>
                    @endforeach
                </div>
            </div>
        </section>

        <!-- ═══ Recommended Roles ═══ -->
        <section class="space-y-8">
            <div class="flex items-center justify-between">
                <h2 class="text-3xl font-headline font-black text-slate-800">Career <span class="text-primary">Trajectories</span></h2>
                <span class="text-slate-400 font-bold uppercase tracking-widest text-xs">Based on market demand</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                @foreach($report['job_recommendations'] ?? [] as $job)
                    <div class="glass-card rounded-[2rem] p-8 flex flex-col gap-6 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
                        <div class="flex justify-between items-start">
                            <h4 class="text-lg font-headline font-bold text-slate-800 leading-tight">{{ $job['role_title'] }}</h4>
                            <div class="text-2xl font-black text-indigo-200">{{ $job['relevance_score'] }}%</div>
                        </div>
                        <p class="text-slate-500 text-sm leading-relaxed flex-1">
                            {{ $job['logic_reasoning'] }}
                        </p>
                        <hr class="border-slate-100">
                        <div class="space-y-3">
                             <div class="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                                <span class="material-symbols-outlined text-[14px]">trending_up</span>
                                Market Demand
                            </div>
                            <p class="text-slate-700 text-xs font-medium leading-relaxed">{{ $job['market_demand'] }}</p>
                        </div>
                    </div>
                @endforeach
            </div>
        </section>

        <!-- ═══ Footer ═══ -->
        <footer class="pt-12 pb-20 text-center border-t border-slate-200">
            <p class="text-slate-400 text-sm font-medium">JobHunt v1.0.0 · AI-powered by Google Gemini LMM</p>
        </footer>
    </main>

</body>
</html>
