import os
import re

steps_dir = '/workspaces/fresh_nest/src/components/booking'

def remove_next_back(filepath, step_num):
    with open(filepath, 'r') as f:
        content = f.read()

    # Remove framer-motion import
    content = re.sub(r"import\s*{\s*motion\s*}\s*from\s*'framer-motion'\n", "", content)
    
    # Replace <motion.div ...> with <div>
    content = re.sub(r"<motion\.div[^>]*>", "<div>", content)
    content = re.sub(r"</motion\.div>", "</div>", content)
    
    if step_num == 1:
        # Remove Props
        content = re.sub(r"interface Props {\s*onNext: \(\) => void\s*}\n\n", "", content)
        content = re.sub(r"export default function BookingStep1\({ onNext }: Props\) {", "export default function BookingStep1() {", content)
        # Remove Next button div
        content = re.sub(r'<div className="mt-6 flex justify-end">.*?</div>\n    </div>', '</div>', content, flags=re.DOTALL)
    elif step_num == 2:
        content = re.sub(r"interface Props {\s*onNext: \(\) => void\s*onBack: \(\) => void\s*}\n\n", "", content)
        content = re.sub(r"export default function BookingStep2\({ onNext, onBack }: Props\) {", "export default function BookingStep2() {", content)
        # Remove buttons div
        content = re.sub(r'<div className="mt-6 flex justify-between">.*?</div>\n    </div>', '</div>', content, flags=re.DOTALL)
    elif step_num == 3:
        content = re.sub(r"interface Props {\s*onNext: \(\) => void\s*onBack: \(\) => void\s*}\n\n", "", content)
        content = re.sub(r"export default function BookingStep3\({ onNext, onBack }: Props\) {", "export default function BookingStep3() {", content)
        # Remove buttons div
        content = re.sub(r'<div className="mt-6 flex justify-between">.*?</div>\n    </div>', '</div>', content, flags=re.DOTALL)
    elif step_num == 4:
        content = re.sub(r"interface Props {\s*onBack: \(\) => void\s*onSetStep: \(step: number\) => void\s*submitError: string \| null\s*}\n\n", "interface Props {\n  submitError: string | null\n}\n\n", content)
        content = re.sub(r"export default function BookingStep4\({ onBack, onSetStep, submitError }: Props\) {", "export default function BookingStep4({ submitError }: Props) {", content)
        # Remove Edit buttons in Step 4
        content = re.sub(r'<button\s*type="button"\s*onClick=\{[^}]*\}\s*className="[^"]*"\s*aria-label="[^"]*"\s*>\s*\{t\(\'booking\.edit\'\)\}\s*</button>', '', content)
        # Remove Back button
        content = re.sub(r'<button\s*type="button"\s*onClick=\{onBack\}[^>]*>.*?booking\.back.*?</button>', '', content, flags=re.DOTALL)
        
    with open(filepath, 'w') as f:
        f.write(content)

for i in range(1, 5):
    remove_next_back(os.path.join(steps_dir, f'BookingStep{i}.tsx'), i)
