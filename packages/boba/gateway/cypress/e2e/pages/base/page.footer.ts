import Base from './base'

export default class PageFooter {
  getSocialMediaLinks() {
    return cy.get('#socialLinks').find('a')
  }

  getFooterLinks() {
    return cy.get('#footerLinks').find('a')
  }
}
