// --- SUPABASE CLIENT SETUP ---
        let supabaseClient = null;
        let isDemoMode = false;

        const DEFAULT_TAGS = [
            { id: 'tag-1', name: 'Alimentação', color: '#ef4444', budget: 1200 },
            { id: 'tag-2', name: 'Moradia', color: '#f59e0b', budget: 2500 },
            { id: 'tag-3', name: 'Transporte', color: '#3b82f6', budget: 500 },
            { id: 'tag-4', name: 'Lazer', color: '#ec4899', budget: 600 },
            { id: 'tag-5', name: 'Salário/Renda', color: '#10b981', budget: 0 },
            { id: 'tag-6', name: 'Investimentos', color: '#6366f1', budget: 1500 },
            { id: 'tag-7', name: 'Saúde', color: '#14b8a6', budget: 400 }
        ];

        const getCurrentYearMonth = () => {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            return `${yyyy}-${mm}`;
        };
        const currentYM = getCurrentYearMonth();

        let appState = {
            currentUser: null,
            tags: [],
            transactions: [],
            investments: [],
            mainChartType: 'doughnut',
            reportChartType: 'bar',
            activeTab: 'dashboard'
        };

        function showNotification(msg, isError = false) {
            const el = document.getElementById('ui-notification');
            const txt = document.getElementById('ui-notification-text');
            txt.textContent = msg;
            el.className = `mb-4 p-4 rounded-xl border text-sm font-medium transition-all flex items-center justify-between ${
                isError 
                ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800' 
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
            }`;
            el.classList.remove('hidden');
        }

        function hideNotification() {
            document.getElementById('ui-notification').classList.add('hidden');
        }

        function checkProtocol() {
            if (window.location.protocol === 'file:') {
                document.getElementById('file-protocol-warning').classList.remove('hidden');
            }
        }

        function initSupabase() {
            checkProtocol();
            const savedUrl = localStorage.getItem('cf_sb_url') || window.NETLIFY_SUPABASE_URL || '';
            const savedKey = localStorage.getItem('cf_sb_key') || window.NETLIFY_SUPABASE_ANON_KEY || '';

            const statusText = document.getElementById('sb-status-text');
            const badge = document.getElementById('supabase-status-badge');

            if (savedUrl && savedKey) {
                try {
                    supabaseClient = window.supabase.createClient(savedUrl, savedKey);
                    statusText.textContent = '⚡ Supabase Conectado';
                    badge.className = 'mb-4 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300';
                    
                    // Listen to auth changes
                    supabaseClient.auth.onAuthStateChange((event, session) => {
                        if (session?.user) {
                            appState.currentUser = session.user;
                            onUserAuthenticated();
                        }
                    });
                } catch (e) {
                    statusText.textContent = '❌ Erro nas credenciais Supabase';
                }
            } else {
                statusText.textContent = '⚠️ Supabase não configurado';
                badge.className = 'mb-4 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs text-amber-700 dark:text-amber-300';
            }
        }

        function openConfigModal() {
            document.getElementById('cfg-url').value = localStorage.getItem('cf_sb_url') || '';
            document.getElementById('cfg-key').value = localStorage.getItem('cf_sb_key') || '';
            document.getElementById('config-modal').classList.remove('hidden');
        }

        function closeConfigModal() {
            document.getElementById('config-modal').classList.add('hidden');
        }

        function saveSupabaseConfig(e) {
            e.preventDefault();
            const url = document.getElementById('cfg-url').value.trim();
            const key = document.getElementById('cfg-key').value.trim();
            localStorage.setItem('cf_sb_url', url);
            localStorage.setItem('cf_sb_key', key);
            closeConfigModal();
            initSupabase();
        }

        function setAuthTab(tab) {
            document.getElementById('login-error').classList.add('hidden');
            document.getElementById('reg-error').classList.add('hidden');
            if (tab === 'login') {
                document.getElementById('form-login').classList.remove('hidden');
                document.getElementById('form-register').classList.add('hidden');
                document.getElementById('tab-btn-login').className = 'flex-1 py-2 text-xs font-bold rounded-lg bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm';
                document.getElementById('tab-btn-register').className = 'flex-1 py-2 text-xs font-bold rounded-lg text-slate-600 dark:text-slate-400';
            } else {
                document.getElementById('form-register').classList.remove('hidden');
                document.getElementById('form-login').classList.add('hidden');
                document.getElementById('tab-btn-register').className = 'flex-1 py-2 text-xs font-bold rounded-lg bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm';
                document.getElementById('tab-btn-login').className = 'flex-1 py-2 text-xs font-bold rounded-lg text-slate-600 dark:text-slate-400';
            }
        }

        async function handleLogin(e) {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const errEl = document.getElementById('login-error');

            if (!supabaseClient) {
                errEl.textContent = 'Configure o Supabase primeiro no botão superior.';
                errEl.classList.remove('hidden');
                return;
            }

            const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
            if (error) {
                errEl.textContent = error.message;
                errEl.classList.remove('hidden');
            } else {
                isDemoMode = false;
                appState.currentUser = data.user;
                onUserAuthenticated();
            }
        }

        async function handleRegister(e) {
            e.preventDefault();
            const name = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;
            const errEl = document.getElementById('reg-error');

            if (!supabaseClient) {
                errEl.textContent = 'Configure o Supabase primeiro no botão superior.';
                errEl.classList.remove('hidden');
                return;
            }

            const { data, error } = await supabaseClient.auth.signUp({
                email,
                password,
                options: { data: { full_name: name } }
            });

            if (error) {
                errEl.textContent = error.message;
                errEl.classList.remove('hidden');
            } else {
                alert('Conta criada no Supabase! Se a confirmação por e-mail estiver ativa, verifique sua caixa de entrada.');
                isDemoMode = false;
                appState.currentUser = data.user;
                onUserAuthenticated();
            }
        }

        function loginDemoMode() {
            isDemoMode = true;
            appState.currentUser = {
                id: 'demo_user',
                email: 'demo@controlfinance.local',
                user_metadata: { full_name: 'Usuário Demonstrativo' }
            };
            appState.tags = [...DEFAULT_TAGS];
            appState.transactions = [
                { id: 'tx-1', title: 'Salário Mensal', amount: 8000, date: `${currentYM}-01`, type: 'INCOME', tagId: 'tag-5', status: 'PAID' },
                { id: 'tx-2', title: 'Aluguel & Condomínio', amount: 2400, date: `${currentYM}-05`, type: 'EXPENSE', tagId: 'tag-2', status: 'PAID' },
                { id: 'tx-3', title: 'Supermercado', amount: 980, date: `${currentYM}-08`, type: 'EXPENSE', tagId: 'tag-1', status: 'PAID' }
            ];
            appState.investments = [
                { id: 'inv-1', name: 'CDB Banco Inter 110% CDI', type: 'CDB', amount: 15000, date: '2025-01-10', rate: 11.75 }
            ];
            onUserAuthenticated();
            showNotification("Modo Demonstrativo ativado. Seus dados estão sendo simulados localmente.");
        }

        async function onUserAuthenticated() {
            document.getElementById('auth-screen').classList.add('hidden');
            document.getElementById('user-badge').classList.remove('hidden');
            document.getElementById('user-badge').classList.add('flex');

            const name = appState.currentUser.user_metadata?.full_name || appState.currentUser.email.split('@')[0];
            document.getElementById('user-name').textContent = name;
            document.getElementById('user-email').textContent = appState.currentUser.email;
            document.getElementById('user-avatar').textContent = name.charAt(0).toUpperCase();

            if (!isDemoMode && supabaseClient) {
                await fetchSupabaseData();
            }

            renderTags();
            renderDashboard();
        }

        async function fetchSupabaseData() {
            try {
                // Fetch Tags
                const { data: tagsData, error: tagsErr } = await supabaseClient.from('tags').select('*');
                if (tagsErr) console.warn('Supabase Tags Warn:', tagsErr.message);
                appState.tags = (tagsData && tagsData.length > 0) ? tagsData : DEFAULT_TAGS;

                // Fetch Transactions & Map DB Column tag_id -> Frontend Property tagId
                const { data: txsData, error: txsErr } = await supabaseClient.from('transactions').select('*').order('date', { ascending: false });
                if (txsErr) {
                    showNotification(`Erro Supabase ao carregar transações: ${txsErr.message}`, true);
                } else if (txsData) {
                    appState.transactions = txsData.map(t => ({
                        ...t,
                        tagId: t.tag_id || t.tagId
                    }));
                }

                // Fetch Investments
                const { data: invsData, error: invsErr } = await supabaseClient.from('investments').select('*');
                if (invsErr) console.warn('Supabase Investments Warn:', invsErr.message);
                appState.investments = invsData || [];
            } catch (err) {
                console.error('Erro geral ao buscar dados do Supabase:', err);
            }
        }

        async function handleLogout() {
            if (confirm('Deseja realmente sair?')) {
                if (supabaseClient && !isDemoMode) {
                    await supabaseClient.auth.signOut();
                }
                appState.currentUser = null;
                document.getElementById('auth-screen').classList.remove('hidden');
                document.getElementById('user-badge').classList.add('hidden');
                hideNotification();
            }
        }

        // --- UTILITY & THEME ---
        const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
        const formatDateBR = (d) => d ? d.split('-').reverse().join('/') : '';
        const getTagById = (id) => appState.tags.find(t => t.id === id) || { name: 'Sem Tag', color: '#64748b' };

        function toggleDarkMode() {
            const html = document.documentElement;
            const icon = document.getElementById('theme-icon');
            if (html.classList.contains('dark')) {
                html.classList.remove('dark');
                if(icon) icon.textContent = '🌙';
            } else {
                html.classList.add('dark');
                if(icon) icon.textContent = '☀️';
            }
        }

        // Garante que o ícone reflita o tema default logo no carregamento
        window.addEventListener('DOMContentLoaded', () => {
            const icon = document.getElementById('theme-icon');
            if(icon && document.documentElement.classList.contains('dark')) {
                icon.textContent = '☀️';
            }
        });

        function switchTab(tabId) {
            appState.activeTab = tabId;
            document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
            document.getElementById(`tab-${tabId}`).classList.remove('hidden');

            document.querySelectorAll('.nav-btn').forEach(btn => btn.className = 'nav-btn px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors');
            const activeBtn = document.getElementById(`nav-${tabId}`);
            if (activeBtn) activeBtn.className = 'nav-btn px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-slate-100 dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-bold';

            if (tabId === 'dashboard') renderDashboard();
            if (tabId === 'investments') renderInvestments();
            if (tabId === 'reports') renderReports();
            if (tabId === 'tags') renderTags();
            if (tabId === 'settings') loadSettingsValues();
        }

        function loadSettingsValues() {
            document.getElementById('cfg-url-settings').value = localStorage.getItem('cf_sb_url') || '';
            document.getElementById('cfg-key-settings').value = localStorage.getItem('cf_sb_key') || '';
        }

        function saveSupabaseConfigSettings(e) {
            e.preventDefault();
            const url = document.getElementById('cfg-url-settings').value.trim();
            const key = document.getElementById('cfg-key-settings').value.trim();
            localStorage.setItem('cf_sb_url', url);
            localStorage.setItem('cf_sb_key', key);
            initSupabase();
            showNotification("Credenciais do Supabase salvas e aplicadas!");
        }

        async function updateAccountSettings(e) {
            e.preventDefault();
            if(isDemoMode || !supabaseClient) {
                showNotification("Ação não permitida no Modo Demo ou sem Supabase configurado.", true);
                return;
            }
            
            const email = document.getElementById('acc-email').value.trim();
            const password = document.getElementById('acc-password').value.trim();
            const updates = {};
            if(email) updates.email = email;
            if(password) updates.password = password;

            if(Object.keys(updates).length === 0) {
                showNotification("Preencha e-mail ou senha para atualizar.", true);
                return;
            }

            const { error } = await supabaseClient.auth.updateUser(updates);
            if(error) {
                showNotification(`Erro ao atualizar: ${error.message}`, true);
            } else {
                showNotification("Dados da conta atualizados com sucesso!");
                document.getElementById('acc-email').value = '';
                document.getElementById('acc-password').value = '';
                if(email) document.getElementById('user-email').textContent = email;
            }
        }

        // --- CHARTS & UI ---
        let mainChartInstance = null;
        let projectionChartInstance = null;
        let reportChartInstance = null;

        function renderDashboard() {
            const monthInput = document.getElementById('dash-month-filter');
            if (!monthInput.value) monthInput.value = currentYM;
            const selectedYM = monthInput.value;
            const searchVal = (document.getElementById('dash-search-input').value || '').toLowerCase();

            const monthTxs = appState.transactions.filter(t => t.date && t.date.startsWith(selectedYM));
            const filteredTxs = monthTxs.filter(t => (t.title || '').toLowerCase().includes(searchVal));

            let income = 0, expense = 0;
            monthTxs.forEach(t => {
                if (t.type === 'INCOME') income += t.amount;
                if (t.type === 'EXPENSE') expense += t.amount;
            });

            document.getElementById('kpi-balance').textContent = formatCurrency(income - expense);
            document.getElementById('kpi-income').textContent = formatCurrency(income);
            document.getElementById('kpi-expense').textContent = formatCurrency(expense);
            document.getElementById('kpi-invested').textContent = formatCurrency(appState.investments.reduce((s, i) => s + i.amount, 0));

            renderMainChart(monthTxs.filter(t => t.type === 'EXPENSE'));
            renderInsights(monthTxs.filter(t => t.type === 'EXPENSE'));
            renderBudgetsProgress(monthTxs.filter(t => t.type === 'EXPENSE'));
            renderTransactionTable(filteredTxs);
        }

        function toggleMainChartType(type) {
            appState.mainChartType = type;
            document.getElementById('btn-chart-doughnut').className = type === 'doughnut' ? 'px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700' : 'px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600';
            document.getElementById('btn-chart-bar').className = type === 'bar' ? 'px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700' : 'px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600';
            renderDashboard();
        }

        function renderMainChart(expenses) {
            const ctx = document.getElementById('mainChart').getContext('2d');
            const tagTotals = {};
            expenses.forEach(e => { tagTotals[e.tagId] = (tagTotals[e.tagId] || 0) + e.amount; });

            const labels = [], data = [], colors = [];
            Object.keys(tagTotals).forEach(tagId => {
                const tag = getTagById(tagId);
                labels.push(tag.name);
                data.push(tagTotals[tagId]);
                colors.push(tag.color);
            });

            if (labels.length === 0) { labels.push('Sem Despesas'); data.push(1); colors.push('#cbd5e1'); }
            if (mainChartInstance) mainChartInstance.destroy();

            mainChartInstance = new Chart(ctx, {
                type: appState.mainChartType,
                data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0 }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
            });
        }

        function renderInsights(expenses) {
            const sorted = [...expenses].sort((a, b) => b.amount - a.amount).slice(0, 3);
            document.getElementById('top-expenses-list').innerHTML = sorted.length ? sorted.map(e => `
                <div class="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-700/40">
                    <span class="font-medium truncate">${e.title}</span>
                    <span class="font-bold text-rose-600">${formatCurrency(e.amount)}</span>
                </div>
            `).join('') : '<span class="text-xs text-slate-400">Nenhum gasto registrado.</span>';

            const counts = {};
            expenses.forEach(e => {
                const k = (e.title || '').toLowerCase();
                counts[k] = counts[k] || { title: e.title, count: 0, total: 0 };
                counts[k].count++; counts[k].total += e.amount;
            });
            const freq = Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 3);
            document.getElementById('frequent-expenses-list').innerHTML = freq.length ? freq.map(f => `
                <div class="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-700/40">
                    <span>${f.title} (${f.count}x)</span>
                    <span class="font-semibold text-xs">${formatCurrency(f.total)}</span>
                </div>
            `).join('') : '<span class="text-xs text-slate-400">Nenhum gasto recorrente.</span>';
        }

        function renderBudgetsProgress(expenses) {
            const container = document.getElementById('budgets-progress-container');
            const tagSpent = {};
            expenses.forEach(e => tagSpent[e.tagId] = (tagSpent[e.tagId] || 0) + e.amount);

            const tagsWithBudget = appState.tags.filter(t => t.budget > 0);
            container.innerHTML = tagsWithBudget.length ? tagsWithBudget.map(tag => {
                const spent = tagSpent[tag.id] || 0;
                const percent = Math.min(Math.round((spent / tag.budget) * 100), 100);
                const isOver = spent > tag.budget;
                return `
                    <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700">
                        <div class="flex justify-between mb-1 text-xs">
                            <span class="font-bold">${tag.name}</span>
                            <span class="${isOver ? 'text-rose-600 font-bold' : 'text-slate-500'}">${formatCurrency(spent)} / ${formatCurrency(tag.budget)}</span>
                        </div>
                        <div class="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden">
                            <div class="h-full rounded-full" style="width: ${percent}%; background-color: ${isOver ? '#ef4444' : tag.color};"></div>
                        </div>
                    </div>
                `;
            }).join('') : '<p class="text-xs text-slate-400">Nenhuma meta cadastrada.</p>';
        }

        function renderTransactionTable(transactions) {
            const tbody = document.getElementById('transactions-table-body');
            tbody.innerHTML = transactions.length ? transactions.map(t => {
                const tag = getTagById(t.tagId);
                const isIncome = t.type === 'INCOME';
                return `
                    <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                        <td class="p-3 pl-5"><span class="text-xs px-2 py-0.5 rounded-full ${t.status==='PAID'?'bg-emerald-100 text-emerald-700':'bg-amber-100 text-amber-700'}">${t.status==='PAID'?'✓ Pago':'⏳ Pendente'}</span></td>
                        <td class="p-3 font-medium">${t.title}</td>
                        <td class="p-3"><span class="text-xs px-2 py-0.5 rounded text-white" style="background-color: ${tag.color}">${tag.name}</span></td>
                        <td class="p-3 text-xs text-slate-500">${formatDateBR(t.date)}</td>
                        <td class="p-3 text-right font-bold ${isIncome ? 'text-emerald-600' : 'text-rose-600'}">${isIncome ? '+' : '-'} ${formatCurrency(t.amount)}</td>
                        <td class="p-3 pr-5 text-center flex justify-center space-x-2">
                            <button onclick="openTransactionModal('${t.id}')" class="p-1 rounded bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-semibold" title="Editar Movimentação">✏️</button>
                            <button onclick="deleteTransaction('${t.id}')" class="p-1 rounded bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-semibold" title="Excluir">🗑️</button>
                        </td>
                    </tr>
                `;
            }).join('') : '<tr><td colspan="6" class="p-4 text-center text-xs text-slate-400">Nenhuma movimentação.</td></tr>';
        }

        // --- INVESTMENTS LOGIC ---
        function renderInvestments() {
            const totalSum = appState.investments.reduce((sum, i) => sum + i.amount, 0);
            document.getElementById('inv-total-sum').textContent = formatCurrency(totalSum);
            document.getElementById('inv-count').textContent = appState.investments.length;

            const tbody = document.getElementById('investments-table-body');
            tbody.innerHTML = appState.investments.length ? appState.investments.map(inv => `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td class="p-3 pl-5 font-bold">${inv.name}</td>
                    <td class="p-3 text-xs"><span class="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">${inv.type}</span></td>
                    <td class="p-3 text-xs text-slate-500">${formatDateBR(inv.date)}</td>
                    <td class="p-3 text-right font-semibold">${inv.rate ? inv.rate + '%' : 'N/A'}</td>
                    <td class="p-3 text-right font-bold text-indigo-600">${formatCurrency(inv.amount)}</td>
                    <td class="p-3 text-center flex justify-center space-x-2">
                        <button onclick="openInvestmentModal('${inv.id}')" class="p-1 rounded bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-semibold" title="Editar Ativo">✏️</button>
                        <button onclick="deleteInvestment('${inv.id}')" class="p-1 rounded bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-semibold" title="Excluir">🗑️</button>
                    </td>
                </tr>
            `).join('') : '<tr><td colspan="6" class="p-4 text-center text-xs text-slate-400">Nenhum ativo.</td></tr>';

            updateInvestmentProjection();
        }

        function updateInvestmentProjection() {
            const initial = parseFloat(document.getElementById('calc-initial').value) || 0;
            const monthly = parseFloat(document.getElementById('calc-monthly').value) || 0;
            const annualRate = (parseFloat(document.getElementById('calc-rate').value) || 0) / 100;
            const years = parseInt(document.getElementById('calc-years').value) || 1;

            const monthlyRate = Math.pow(1 + annualRate, 1/12) - 1;
            const labels = ['Início'];
            const dataAcc = [initial];

            let total = initial;
            for (let y = 1; y <= years; y++) {
                for (let m = 1; m <= 12; m++) { total = (total + monthly) * (1 + monthlyRate); }
                labels.push(`${y} ano(s)`);
                dataAcc.push(Math.round(total));
            }

            document.getElementById('inv-projection-1y').textContent = formatCurrency(dataAcc[1] || total);

            const ctx = document.getElementById('projectionChart').getContext('2d');
            if (projectionChartInstance) projectionChartInstance.destroy();

            projectionChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [{ label: 'Montante Projetado', data: dataAcc, borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)', fill: true }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }

        // --- REPORTS & TAGS ---
        function renderReports() {
            const tagSelect = document.getElementById('rep-tag');
            if (tagSelect.options.length === 0) {
                tagSelect.innerHTML = '<option value="ALL">Todas as Tags</option>' + appState.tags.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
            }

            const startDate = document.getElementById('rep-date-start').value;
            const endDate = document.getElementById('rep-date-end').value;
            const typeFilter = document.getElementById('rep-type').value;
            const selectedTag = document.getElementById('rep-tag').value || 'ALL';

            // Filter transactions dynamically
            let filtered = appState.transactions.filter(t => {
                let match = true;
                if (startDate && t.date < startDate) match = false;
                if (endDate && t.date > endDate) match = false;
                if (typeFilter !== 'ALL' && t.type !== typeFilter) match = false;
                if (selectedTag !== 'ALL' && t.tagId !== selectedTag) match = false;
                return match;
            });

            let inSum = 0, outSum = 0;
            filtered.forEach(t => {
                if (t.type === 'INCOME') inSum += t.amount;
                if (t.type === 'EXPENSE') outSum += t.amount;
            });

            document.getElementById('rep-kpi-income').textContent = formatCurrency(inSum);
            document.getElementById('rep-kpi-expense').textContent = formatCurrency(outSum);
            document.getElementById('rep-kpi-net').textContent = formatCurrency(inSum - outSum);

            const subtitleText = [];
            if (typeFilter === 'EXPENSE') subtitleText.push('Apenas Retiradas/Saídas');
            else if (typeFilter === 'INCOME') subtitleText.push('Apenas Ganhos/Entradas');
            else subtitleText.push('Todos os Tipos');
            if (selectedTag !== 'ALL') subtitleText.push(`Tag: ${getTagById(selectedTag).name}`);
            document.getElementById('rep-subtitle').textContent = `Filtro: ${subtitleText.join(' | ')} (${filtered.length} lançamentos)`;

            const tbody = document.getElementById('report-table-body');
            tbody.innerHTML = filtered.length ? filtered.map(t => `
                <tr>
                    <td class="p-3 pl-5 text-xs text-slate-500">${formatDateBR(t.date)}</td>
                    <td class="p-3 font-medium">${t.title}</td>
                    <td class="p-3 text-xs"><span class="px-2 py-0.5 rounded font-bold ${t.type==='INCOME'?'bg-emerald-100 text-emerald-700':'bg-rose-100 text-rose-700'}">${t.type==='INCOME'?'Ganho':'Retirada'}</span></td>
                    <td class="p-3"><span class="text-xs px-2 py-0.5 rounded text-white" style="background-color: ${getTagById(t.tagId).color}">${getTagById(t.tagId).name}</span></td>
                    <td class="p-3 text-xs">${t.status==='PAID'?'✓ Concluído':'⏳ Pendente'}</td>
                    <td class="p-3 pr-5 text-right font-bold ${t.type==='INCOME'?'text-emerald-600':'text-rose-600'}">${t.type==='INCOME'?'+':'-'} ${formatCurrency(t.amount)}</td>
                </tr>
            `).join('') : '<tr><td colspan="6" class="p-4 text-center text-xs text-slate-400">Nenhum lançamento encontrado para os filtros selecionados.</td></tr>';

            renderReportChart(filtered, typeFilter);
        }

        function toggleReportChartType(type) {
            appState.reportChartType = type;
            document.getElementById('btn-rep-chart-bar').className = type === 'bar' ? 'px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300' : 'px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300';
            document.getElementById('btn-rep-chart-doughnut').className = type === 'doughnut' ? 'px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300' : 'px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300';
            renderReports();
        }

        function renderReportChart(txs, typeFilter) {
            const ctx = document.getElementById('reportChart').getContext('2d');
            const totals = {};
            const tagLabelEl = document.getElementById('rep-chart-tag-label');

            if (typeFilter === 'ALL') {
                tagLabelEl.textContent = 'Comparativo por Categoria (Todas)';
            } else if (typeFilter === 'INCOME') {
                tagLabelEl.textContent = 'Distribuição de Ganhos por Categoria';
            } else {
                tagLabelEl.textContent = 'Distribuição de Despesas por Categoria';
            }

            txs.forEach(t => totals[t.tagId] = (totals[t.tagId] || 0) + t.amount);

            const labels = [], data = [], colors = [];
            Object.keys(totals).forEach(id => {
                labels.push(getTagById(id).name);
                data.push(totals[id]);
                colors.push(getTagById(id).color);
            });

            if (labels.length === 0) {
                labels.push('Sem Dados');
                data.push(0);
                colors.push('#cbd5e1');
            }

            if (reportChartInstance) reportChartInstance.destroy();
            reportChartInstance = new Chart(ctx, {
                type: appState.reportChartType,
                data: { labels, datasets: [{ label: 'Valor (R$)', data, backgroundColor: colors, borderWidth: 0, borderRadius: appState.reportChartType === 'bar' ? 6 : 0 }] },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false, 
                    plugins: { 
                        legend: { display: appState.reportChartType === 'doughnut', position: 'bottom' },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return ' R$ ' + (context.parsed.y !== undefined ? context.parsed.y : context.parsed).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                                }
                            }
                        }
                    } 
                }
            });
        }

        function toggleReportChartVisibility() {
            const isChecked = document.getElementById('rep-show-chart').checked;
            document.getElementById('rep-chart-wrapper').style.display = isChecked ? 'block' : 'none';
        }

        function exportReportCSV() {
            const rows = [['Data', 'Titulo', 'Tipo', 'Tag', 'Valor']];
            appState.transactions.forEach(t => rows.push([t.date, `"${t.title}"`, t.type, `"${getTagById(t.tagId).name}"`, t.amount]));
            const csv = 'data:text/csv;charset=utf-8,' + rows.map(r => r.join(',')).join('\n');
            const link = document.createElement('a');
            link.href = encodeURI(csv);
            link.download = `relatorio_financeiro_${currentYM}.csv`;
            link.click();
        }

        async function handleCSVImport(e) {
            const file = e.target.files[0];
            if(!file) return;
            
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const text = event.target.result;
                    const lines = text.split('\n').filter(l => l.trim() !== '');
                    const newTxs = [];
                    const newTags = [];
                    
                    // Pula o cabeçalho (i=1)
                    for(let i=1; i<lines.length; i++) {
                        // Regex para separar por vírgulas preservando vírgulas dentro de aspas (formato da exportação)
                        const cols = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                        if(cols.length >= 5) {
                            const date = cols[0].replace(/"/g, '').trim();
                            const title = cols[1].replace(/"/g, '').trim();
                            const type = cols[2].replace(/"/g, '').trim();
                            const tagName = cols[3].replace(/"/g, '').trim();
                            const amount = parseFloat(cols[4].replace(/"/g, '').trim());

                            if(!date || !title || !type || !tagName || isNaN(amount)) continue;

                            // Verifica se a tag existe
                            let tag = appState.tags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
                            if(!tag) {
                                tag = { 
                                    id: 'tag-' + Date.now() + Math.floor(Math.random()*1000), 
                                    name: tagName, 
                                    color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'), 
                                    budget: 0 
                                };
                                if(appState.currentUser && !isDemoMode) tag.user_id = appState.currentUser.id;
                                appState.tags.push(tag);
                                newTags.push(tag);
                            }

                            const tx = {
                                id: 'tx-' + Date.now() + Math.floor(Math.random()*1000),
                                title, amount, date, type, tag_id: tag.id, status: 'PAID'
                            };
                            if(appState.currentUser && !isDemoMode) tx.user_id = appState.currentUser.id;
                            
                            // Adiciona propriedades locais necessárias (mapeamento frontend)
                            newTxs.push({...tx, tagId: tag.id});
                        }
                    }

                    if(newTxs.length > 0) {
                        // Salvar novas tags no Supabase
                        if(newTags.length > 0 && supabaseClient && !isDemoMode) {
                            await supabaseClient.from('tags').insert(newTags.map(t => ({id: t.id, user_id: t.user_id, name: t.name, color: t.color, budget: t.budget})));
                        }

                        // Salvar transações no estado e no Supabase
                        appState.transactions.unshift(...newTxs);
                        if(supabaseClient && !isDemoMode) {
                            const dbTxs = newTxs.map(t => {
                                const { tagId, ...rest } = t;
                                return rest;
                            });
                            const { error } = await supabaseClient.from('transactions').insert(dbTxs);
                            if(error) throw error;
                        }

                        showNotification(`${newTxs.length} transações importadas com sucesso!`);
                        renderDashboard();
                        if (appState.activeTab === 'reports') renderReports();
                    } else {
                        showNotification("Nenhuma transação válida encontrada no CSV.", true);
                    }
                } catch (err) {
                    showNotification(`Erro ao importar: ${err.message}`, true);
                }
            };
            reader.readAsText(file);
            e.target.value = ''; // Reset do input file
        }

        function printReportPDF() { window.print(); }

        // --- TAG CRUD LOGIC ---
        function renderTags() {
            const container = document.getElementById('tags-list-container');
            container.innerHTML = appState.tags.length ? appState.tags.map(t => `
                <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 flex justify-between items-center transition-all hover:shadow-sm">
                    <div class="flex items-center space-x-3 overflow-hidden">
                        <span class="w-4 h-4 rounded-full flex-shrink-0" style="background-color: ${t.color}"></span>
                        <div class="truncate">
                            <span class="font-bold text-sm block text-slate-800 dark:text-slate-100 truncate">${t.name}</span>
                            <span class="text-xs text-slate-400 block">${t.budget ? 'Meta: ' + formatCurrency(t.budget) : 'Sem Meta'}</span>
                        </div>
                    </div>
                    <div class="flex items-center space-x-1.5 flex-shrink-0 ml-2">
                        <button onclick="editTag('${t.id}')" class="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-semibold transition-colors" title="Editar Tag">
                            ✏️
                        </button>
                        <button onclick="deleteTag('${t.id}')" class="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-colors" title="Excluir Tag">
                            🗑️
                        </button>
                    </div>
                </div>
            `).join('') : '<p class="text-xs text-slate-400 col-span-2">Nenhuma tag cadastrada.</p>';

            const tagSelect = document.getElementById('tx-tag-select');
            if (tagSelect) {
                tagSelect.innerHTML = appState.tags.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
            }
            const repTagSelect = document.getElementById('rep-tag');
            if (repTagSelect) {
                repTagSelect.innerHTML = '<option value="ALL">Todas as Tags</option>' + appState.tags.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
            }
        }

        function editTag(id) {
            const tag = appState.tags.find(t => t.id === id);
            if (!tag) return;
            document.getElementById('tag-edit-id').value = tag.id;
            document.getElementById('tag-name-input').value = tag.name;
            document.getElementById('tag-color-input').value = tag.color || '#10b981';
            document.getElementById('tag-budget-input').value = tag.budget || '';

            document.getElementById('tag-form-title').textContent = '✏️ Editar Tag';
            document.getElementById('btn-save-tag').textContent = 'Atualizar Tag';
            document.getElementById('tag-name-input').focus();
        }

        function resetTagForm() {
            document.getElementById('tag-edit-id').value = '';
            document.getElementById('tag-name-input').value = '';
            document.getElementById('tag-budget-input').value = '';
            document.getElementById('tag-color-input').value = '#10b981';

            document.getElementById('tag-form-title').textContent = '🏷️ Cadastrar / Editar Tag';
            document.getElementById('btn-save-tag').textContent = 'Salvar Tag';
        }

        async function saveTag() {
            const editId = document.getElementById('tag-edit-id').value;
            const name = document.getElementById('tag-name-input').value.trim();
            const color = document.getElementById('tag-color-input').value;
            const budget = parseFloat(document.getElementById('tag-budget-input').value) || 0;

            if (!name) {
                alert('Informe o nome da tag');
                return;
            }

            if (editId) {
                // EDIT EXISTING TAG
                const index = appState.tags.findIndex(t => t.id === editId);
                if (index !== -1) {
                    appState.tags[index] = { ...appState.tags[index], name, color, budget };

                    if (supabaseClient && !isDemoMode) {
                        const { error } = await supabaseClient
                            .from('tags')
                            .update({ name, color, budget })
                            .eq('id', editId);
                        
                        if (error) {
                            showNotification(`Erro ao atualizar tag no Supabase: ${error.message}`, true);
                        } else {
                            showNotification("Tag atualizada no Supabase!");
                        }
                    } else {
                        showNotification("Tag atualizada!");
                    }
                }
            } else {
                // CREATE NEW TAG
                const newTag = { id: 'tag-' + Date.now(), name, color, budget };
                if (appState.currentUser?.id && !isDemoMode) {
                    newTag.user_id = appState.currentUser.id;
                }
                
                appState.tags.push(newTag);

                if (supabaseClient && !isDemoMode) {
                    const { error } = await supabaseClient.from('tags').insert([newTag]);
                    if (error) {
                        showNotification(`Erro ao salvar tag no Supabase: ${error.message}`, true);
                    } else {
                        showNotification("Tag salva no Supabase!");
                    }
                } else {
                    showNotification("Tag salva!");
                }
            }

            resetTagForm();
            renderTags();
            renderDashboard();
        }

        async function deleteTag(id) {
            const tag = appState.tags.find(t => t.id === id);
            if (!tag) return;

            const linkedTxs = appState.transactions.filter(t => t.tagId === id);
            if (linkedTxs.length > 0) {
                if (!confirm(`A tag "${tag.name}" possui ${linkedTxs.length} transação(ões) vinculada(s). Deseja realmente excluí-la?`)) {
                    return;
                }
            } else {
                if (!confirm(`Deseja realmente excluir a tag "${tag.name}"?`)) {
                    return;
                }
            }

            appState.tags = appState.tags.filter(t => t.id !== id);

            if (supabaseClient && !isDemoMode) {
                const { error } = await supabaseClient.from('tags').delete().eq('id', id);
                if (error) {
                    showNotification(`Erro ao excluir tag no Supabase: ${error.message}`, true);
                } else {
                    showNotification("Tag removida do Supabase!");
                }
            } else {
                showNotification("Tag removida!");
            }

            renderTags();
            renderDashboard();
        }

        // --- TRANSACTION CRUD & MODAL HANDLERS ---
        function openTransactionModal(editTxId = null) {
            const form = document.getElementById('form-transaction');
            form.reset();

            if (editTxId) {
                const tx = appState.transactions.find(t => t.id === editTxId);
                if (tx) {
                    document.getElementById('tx-id').value = tx.id;
                    document.getElementById('tx-title-input').value = tx.title;
                    document.getElementById('tx-amount-input').value = tx.amount;
                    document.getElementById('tx-date-input').value = tx.date;
                    document.getElementById('tx-tag-select').value = tx.tagId;
                    document.getElementById('tx-status-select').value = tx.status || 'PAID';
                    setTxType(tx.type);
                    document.getElementById('modal-tx-title').textContent = '✏️ Editar Movimentação';
                }
            } else {
                document.getElementById('tx-id').value = '';
                document.getElementById('tx-date-input').valueAsDate = new Date();
                setTxType('EXPENSE');
                document.getElementById('modal-tx-title').textContent = '➕ Nova Movimentação';
            }

            document.getElementById('modal-transaction').classList.remove('hidden');
        }

        function closeTransactionModal() { 
            document.getElementById('modal-transaction').classList.add('hidden'); 
        }

        function setTxType(type) { 
            document.getElementById('tx-type').value = type;
            const btnIn = document.getElementById('btn-tx-income');
            const btnEx = document.getElementById('btn-tx-expense');
            if (type === 'INCOME') {
                btnIn.className = "py-2 text-xs font-bold rounded-lg border bg-emerald-100 border-emerald-300 text-emerald-700 flex justify-center items-center space-x-1";
                btnEx.className = "py-2 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-600 flex justify-center items-center space-x-1";
            } else {
                btnEx.className = "py-2 text-xs font-bold rounded-lg border bg-rose-100 border-rose-300 text-rose-700 flex justify-center items-center space-x-1";
                btnIn.className = "py-2 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-600 flex justify-center items-center space-x-1";
            }
        }

        async function handleTransactionSubmit(e) {
            e.preventDefault();
            const txIdVal = document.getElementById('tx-id').value;
            const tagIdVal = document.getElementById('tx-tag-select').value;
            
            const dbTxPayload = {
                title: document.getElementById('tx-title-input').value,
                amount: parseFloat(document.getElementById('tx-amount-input').value) || 0,
                date: document.getElementById('tx-date-input').value,
                type: document.getElementById('tx-type').value,
                tag_id: tagIdVal,
                status: document.getElementById('tx-status-select').value
            };

            if (appState.currentUser?.id && !isDemoMode) {
                dbTxPayload.user_id = appState.currentUser.id;
            }

            if (txIdVal) {
                // EDIT EXISTING TRANSACTION
                const idx = appState.transactions.findIndex(t => t.id === txIdVal);
                if (idx !== -1) {
                    appState.transactions[idx] = {
                        ...appState.transactions[idx],
                        ...dbTxPayload,
                        tagId: tagIdVal
                    };
                }

                if (supabaseClient && !isDemoMode) {
                    const { error } = await supabaseClient.from('transactions').update(dbTxPayload).eq('id', txIdVal);
                    if (error) {
                        showNotification(`Erro Supabase ao atualizar: ${error.message}`, true);
                    } else {
                        showNotification("Transação atualizada no Supabase com sucesso!");
                    }
                } else {
                    showNotification("Transação atualizada com sucesso!");
                }
            } else {
                // CREATE NEW TRANSACTION
                const newId = 'tx-' + Date.now();
                dbTxPayload.id = newId;

                const clientTx = {
                    ...dbTxPayload,
                    tagId: tagIdVal
                };

                appState.transactions.unshift(clientTx);

                if (supabaseClient && !isDemoMode) {
                    const { error } = await supabaseClient.from('transactions').insert([dbTxPayload]);
                    if (error) {
                        showNotification(`Erro Supabase (400/RLS): ${error.message}`, true);
                    } else {
                        showNotification("Transação gravada no Supabase com sucesso!");
                    }
                } else {
                    showNotification("Nova transação adicionada!");
                }
            }

            closeTransactionModal();
            renderDashboard();
            if (appState.activeTab === 'reports') renderReports();
        }

        async function deleteTransaction(id) {
            if (confirm('Deseja realmente excluir esta transação?')) {
                appState.transactions = appState.transactions.filter(t => t.id !== id);
                if (supabaseClient && !isDemoMode) {
                    const { error } = await supabaseClient.from('transactions').delete().eq('id', id);
                    if (error) {
                        showNotification(`Erro ao excluir no Supabase: ${error.message}`, true);
                    } else {
                        showNotification("Transação excluída!");
                    }
                } else {
                    showNotification("Transação excluída!");
                }
                renderDashboard();
                if (appState.activeTab === 'reports') renderReports();
            }
        }

        // --- INVESTMENT CRUD & MODAL HANDLERS ---
        function openInvestmentModal(editInvId = null) {
            const form = document.getElementById('form-investment');
            form.reset();

            if (editInvId) {
                const inv = appState.investments.find(i => i.id === editInvId);
                if (inv) {
                    document.getElementById('inv-id').value = inv.id;
                    document.getElementById('inv-name-input').value = inv.name;
                    document.getElementById('inv-type-select').value = inv.type;
                    document.getElementById('inv-amount-input').value = inv.amount;
                    document.getElementById('inv-date-input').value = inv.date;
                    document.getElementById('inv-rate-input').value = inv.rate || '';
                    document.getElementById('modal-inv-title').textContent = '✏️ Editar Ativo de Investimento';
                }
            } else {
                document.getElementById('inv-id').value = '';
                document.getElementById('inv-date-input').valueAsDate = new Date();
                document.getElementById('modal-inv-title').textContent = '➕ Cadastrar Ativo de Investimento';
            }

            document.getElementById('modal-investment').classList.remove('hidden');
        }

        function closeInvestmentModal() { 
            document.getElementById('modal-investment').classList.add('hidden'); 
        }

        async function handleInvestmentSubmit(e) {
            e.preventDefault();
            const invIdVal = document.getElementById('inv-id').value;

            const invPayload = {
                name: document.getElementById('inv-name-input').value,
                type: document.getElementById('inv-type-select').value,
                amount: parseFloat(document.getElementById('inv-amount-input').value) || 0,
                date: document.getElementById('inv-date-input').value,
                rate: parseFloat(document.getElementById('inv-rate-input').value) || 0
            };

            if (appState.currentUser?.id && !isDemoMode) {
                invPayload.user_id = appState.currentUser.id;
            }

            if (invIdVal) {
                // EDIT EXISTING INVESTMENT
                const idx = appState.investments.findIndex(i => i.id === invIdVal);
                if (idx !== -1) {
                    appState.investments[idx] = { ...appState.investments[idx], ...invPayload };
                }

                if (supabaseClient && !isDemoMode) {
                    const { error } = await supabaseClient.from('investments').update(invPayload).eq('id', invIdVal);
                    if (error) {
                        showNotification(`Erro ao atualizar ativo: ${error.message}`, true);
                    } else {
                        showNotification("Ativo de investimento atualizado!");
                    }
                } else {
                    showNotification("Ativo de investimento atualizado!");
                }
            } else {
                // CREATE NEW INVESTMENT
                const newInv = {
                    id: 'inv-' + Date.now(),
                    ...invPayload
                };

                appState.investments.unshift(newInv);

                if (supabaseClient && !isDemoMode) {
                    const { error } = await supabaseClient.from('investments').insert([newInv]);
                    if (error) {
                        showNotification(`Erro ao salvar ativo: ${error.message}`, true);
                    } else {
                        showNotification("Ativo de investimento registrado!");
                    }
                } else {
                    showNotification("Ativo de investimento registrado!");
                }
            }

            closeInvestmentModal();
            renderInvestments();
        }

        async function deleteInvestment(id) {
            if (confirm('Deseja realmente excluir este ativo?')) {
                appState.investments = appState.investments.filter(i => i.id !== id);
                if (supabaseClient && !isDemoMode) {
                    const { error } = await supabaseClient.from('investments').delete().eq('id', id);
                    if (error) {
                        showNotification(`Erro ao remover ativo: ${error.message}`, true);
                    } else {
                        showNotification("Ativo removido!");
                    }
                } else {
                    showNotification("Ativo removido!");
                }
                renderInvestments();
            }
        }

        window.addEventListener('DOMContentLoaded', () => {
            initSupabase();
        });
    
