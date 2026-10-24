import { loadTemplate } from '../../utils/templateLoader.js';

export class ProfilePageComponent {
  static templatePath = '/src/pages/ProfilePage/ProfilePage.html';

  static async loadTemplate() {
    return await loadTemplate(ProfilePageComponent.templatePath);
  }

  static async mount(container) {
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (target) {
      target.innerHTML = await this.loadTemplate();
    }
    return target;
  }
}

export default ProfilePageComponent;
